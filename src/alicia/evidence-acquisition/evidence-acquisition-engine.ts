import { ConflictDetector } from "./conflict-detector";
import { EvidenceCollector } from "./evidence-collector";
import { EvidenceMerger } from "./evidence-merger";
import { EvidenceNormalizer } from "./evidence-normalizer";
import { EvidencePackageBuilder } from "./evidence-package-builder";
import { EvidenceHistory } from "./evidence-history";
import { EvidenceMetrics } from "./evidence-metrics";
import { EvidenceScoreCalculator } from "./evidence-score";
import type {
  AcquisitionRunResult,
  ConnectorEvidenceInput,
  EvidencePackage,
} from "./types";

function runId(): string {
  return `evidence-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type EvidenceAcquisitionEngineOptions = {
  collector?: EvidenceCollector;
  normalizer?: EvidenceNormalizer;
  merger?: EvidenceMerger;
  conflictDetector?: ConflictDetector;
  packageBuilder?: EvidencePackageBuilder;
  scoreCalculator?: EvidenceScoreCalculator;
  history?: EvidenceHistory;
  metrics?: EvidenceMetrics;
  minRecordsPerCandidate?: number;
};

export class EvidenceAcquisitionEngine {
  private readonly collector: EvidenceCollector;
  private readonly normalizer: EvidenceNormalizer;
  private readonly merger: EvidenceMerger;
  private readonly conflictDetector: ConflictDetector;
  private readonly packageBuilder: EvidencePackageBuilder;
  private readonly scoreCalculator: EvidenceScoreCalculator;
  private readonly history: EvidenceHistory;
  private readonly metrics: EvidenceMetrics;
  private readonly minRecordsPerCandidate: number;
  private readonly packages = new Map<string, EvidencePackage>();
  private lastRunId: string | null = null;
  private lastRunAt: string | null = null;

  constructor(options: EvidenceAcquisitionEngineOptions = {}) {
    this.collector = options.collector ?? new EvidenceCollector();
    this.normalizer = options.normalizer ?? new EvidenceNormalizer();
    this.merger = options.merger ?? new EvidenceMerger();
    this.conflictDetector = options.conflictDetector ?? new ConflictDetector();
    this.packageBuilder = options.packageBuilder ?? new EvidencePackageBuilder();
    this.scoreCalculator = options.scoreCalculator ?? new EvidenceScoreCalculator();
    this.history = options.history ?? new EvidenceHistory();
    this.metrics = options.metrics ?? new EvidenceMetrics();
    this.minRecordsPerCandidate = options.minRecordsPerCandidate ?? 1;
  }

  getHistory(): EvidenceHistory {
    return this.history;
  }

  getMetrics(): EvidenceMetrics {
    return this.metrics;
  }

  getPackages(): EvidencePackage[] {
    return [...this.packages.values()];
  }

  getPackage(candidateId: string): EvidencePackage | null {
    return this.packages.get(candidateId) ?? null;
  }

  getLastRunId(): string | null {
    return this.lastRunId;
  }

  getLastRunAt(): string | null {
    return this.lastRunAt;
  }

  acquire(inputs: ConnectorEvidenceInput[]): AcquisitionRunResult {
    const startedAt = new Date().toISOString();
    const currentRunId = runId();
    const groups = this.collector.collect(inputs);
    const packages: EvidencePackage[] = [];
    let rejectedCount = 0;
    let conflictCount = 0;

    this.metrics.recordCandidates(groups.length);

    for (const group of groups) {
      const normalizedRecords = [];

      for (const item of group.records) {
        normalizedRecords.push(this.normalizer.normalize(item.record, item.input));
      }

      if (normalizedRecords.length < this.minRecordsPerCandidate) {
        rejectedCount += 1;
        this.metrics.recordRejected();
        this.history.record({
          packageId: `rejected-${group.candidateId}`,
          candidateId: group.candidateId,
          version: 0,
          action: "rejected",
          timestamp: startedAt,
          conflictCount: 0,
          coverageAverage: 0,
        });
        continue;
      }

      const merged = this.merger.merge(
        group.candidateKey,
        group.candidateId,
        normalizedRecords,
      );

      const conflicts = this.conflictDetector.detect(
        group.candidateId,
        merged,
        startedAt,
      );
      conflictCount += conflicts.length;

      const coverage = this.scoreCalculator.calculate(merged);
      const coverageAverage = this.scoreCalculator.averageCoverage(coverage);

      const existing = this.packages.get(group.candidateId);
      const version = existing ? existing.metadata.version + 1 : 1;
      const createdAt = existing?.metadata.createdAt ?? startedAt;

      const pkg = this.packageBuilder.build({
        merged,
        conflicts,
        coverage,
        runId: currentRunId,
        version,
        createdAt,
        updatedAt: startedAt,
      });

      this.packages.set(group.candidateId, pkg);
      packages.push(pkg);

      if (existing) {
        this.metrics.recordUpdated(conflicts.length, coverageAverage);
        this.history.record({
          packageId: pkg.packageId,
          candidateId: group.candidateId,
          version,
          action: "updated",
          timestamp: startedAt,
          conflictCount: conflicts.length,
          coverageAverage,
        });
      } else {
        this.metrics.recordCreated(conflicts.length, coverageAverage);
        this.history.record({
          packageId: pkg.packageId,
          candidateId: group.candidateId,
          version,
          action: "created",
          timestamp: startedAt,
          conflictCount: conflicts.length,
          coverageAverage,
        });
      }
    }

    const completedAt = new Date().toISOString();
    this.lastRunId = currentRunId;
    this.lastRunAt = completedAt;
    this.metrics.setLastRunAt(completedAt);

    return {
      runId: currentRunId,
      startedAt,
      completedAt,
      packages,
      rejectedCount,
      conflictCount,
    };
  }

  reset(): void {
    this.packages.clear();
    this.history.reset();
    this.metrics.reset();
    this.lastRunId = null;
    this.lastRunAt = null;
  }
}
