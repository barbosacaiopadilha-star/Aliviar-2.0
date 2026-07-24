import { DiscoveryAuditTrail, globalDiscoveryAuditTrail } from "./audit";
import { deduplicateCandidates, markQueued, normalizeDiscoveryRecord } from "./deduplicator";
import { DiscoveryQueue, globalDiscoveryQueue } from "./discovery-queue";
import { DiscoveryMetrics, globalDiscoveryMetrics } from "./metrics";
import type { DiscoverySource } from "./ports/discovery-source";
import { defaultDiscoverySources } from "./sources/mock-sources";
import type {
  DiscoveryCandidate,
  DiscoveryQueueItem,
  DiscoveryRunResult,
  DiscoverySourceResult,
  SourceHealthStatus,
} from "./types";

export type DiscoveryEngineOptions = {
  sources?: DiscoverySource[];
  queue?: DiscoveryQueue;
  metrics?: DiscoveryMetrics;
  audit?: DiscoveryAuditTrail;
};

async function resolveHealth(source: DiscoverySource): Promise<SourceHealthStatus> {
  return Promise.resolve(source.health());
}

async function resolveDiscover(source: DiscoverySource): Promise<DiscoverySourceResult> {
  return Promise.resolve(source.discover());
}

export class DiscoveryEngine {
  private readonly sources: DiscoverySource[];
  private readonly queue: DiscoveryQueue;
  private readonly metrics: DiscoveryMetrics;
  private readonly audit: DiscoveryAuditTrail;

  constructor(options: DiscoveryEngineOptions = {}) {
    this.sources = [...(options.sources ?? defaultDiscoverySources)].sort(
      (left, right) => left.priority - right.priority,
    );
    this.queue = options.queue ?? globalDiscoveryQueue;
    this.metrics = options.metrics ?? globalDiscoveryMetrics;
    this.audit = options.audit ?? globalDiscoveryAuditTrail;
  }

  getQueue(): DiscoveryQueue {
    return this.queue;
  }

  getMetrics(): DiscoveryMetrics {
    return this.metrics;
  }

  getAuditTrail(): DiscoveryAuditTrail {
    return this.audit;
  }

  async run(): Promise<DiscoveryRunResult> {
    const startedAt = new Date().toISOString();
    const runStarted = performance.now();
    const sourceHealth: Record<string, SourceHealthStatus> = {};
    const normalizedCandidates: DiscoveryCandidate[] = [];
    let sourceFailures = 0;
    let ignoredFromSources = 0;

    for (const source of this.sources) {
      const sourceStarted = performance.now();
      sourceHealth[source.id] = await resolveHealth(source);

      if (sourceHealth[source.id] === "OFFLINE") {
        sourceFailures += 1;
        this.audit.record({
          sourceId: source.id,
          sourceName: source.name,
          foundCount: 0,
          normalizedCount: 0,
          duplicateCount: 0,
          failed: true,
          error: "Fonte offline.",
          durationMs: Math.round(performance.now() - sourceStarted),
        });
        continue;
      }

      try {
        const result = await resolveDiscover(source);
        const discoveredAt = new Date().toISOString();
        const normalized = result.records
          .map((record) => normalizeDiscoveryRecord(record, source.id, discoveredAt))
          .filter((candidate): candidate is DiscoveryCandidate => Boolean(candidate));

        ignoredFromSources += result.records.length - normalized.length;
        normalizedCandidates.push(...normalized);

        this.audit.record({
          sourceId: source.id,
          sourceName: source.name,
          foundCount: result.records.length,
          normalizedCount: normalized.length,
          duplicateCount: 0,
          failed: Boolean(result.error),
          error: result.error,
          durationMs: Math.round(performance.now() - sourceStarted),
        });

        if (result.error) {
          sourceFailures += 1;
        }
      } catch (error) {
        sourceFailures += 1;
        this.audit.record({
          sourceId: source.id,
          sourceName: source.name,
          foundCount: 0,
          normalizedCount: 0,
          duplicateCount: 0,
          failed: true,
          error: error instanceof Error ? error.message : "Falha desconhecida.",
          durationMs: Math.round(performance.now() - sourceStarted),
        });
      }
    }

    const { unique, duplicates, ignored } = deduplicateCandidates(normalizedCandidates);
    const queueItems: DiscoveryQueueItem[] = [];

    for (const candidate of unique) {
      const queued = markQueued(candidate);
      const status = queued.confidence >= 0.8 ? "READY_FOR_EVIDENCE" : "DISCOVERED";
      queueItems.push(this.queue.enqueue(queued, status));
    }

    for (const duplicate of duplicates) {
      const primary = unique.find((item) => item.hashIdentidade === duplicate.hashIdentidade);
      queueItems.push(
        this.queue.markDuplicate(duplicate, primary?.candidateId ?? duplicate.candidateId),
      );
    }

    for (const candidate of ignored) {
      queueItems.push(this.queue.markIgnored(candidate));
    }

    const durationMs = Math.round(performance.now() - runStarted);
    const completedAt = new Date().toISOString();

    this.metrics.recordRun({
      found: normalizedCandidates.length + ignoredFromSources,
      duplicates: duplicates.length,
      ignored: ignored.length + ignoredFromSources,
      queued: queueItems.filter((item) => item.status === "DISCOVERED").length,
      readyForEvidence: queueItems.filter((item) => item.status === "READY_FOR_EVIDENCE").length,
      sourcesExecuted: this.sources.length,
      sourceFailures,
      durationMs,
      at: completedAt,
    });

    return {
      runId: `run-${Date.now()}`,
      startedAt,
      completedAt,
      candidates: unique,
      queueItems,
      metrics: this.metrics.snapshot(),
      sourceHealth,
    };
  }
}

export async function runDiscovery(options?: DiscoveryEngineOptions): Promise<DiscoveryRunResult> {
  return new DiscoveryEngine(options).run();
}
