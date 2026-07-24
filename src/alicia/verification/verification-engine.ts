import { createCorrelationId } from "@/alicia/event-bus";

import { VerificationPlanner } from "./planner";
import { ProfileRegistry } from "./profile-registry";
import { VerificationScheduler } from "./scheduler";
import { VerificationHistory } from "./verification-history";
import { VerificationMetrics } from "./verification-metrics";
import { VerificationRunner } from "./verification-runner";
import { isUpdateRequired, requiresPublication } from "./verification-decision";
import type {
  VerificationProfile,
  VerificationQueueItem,
  VerificationRunResult,
} from "./types";

export type VerificationEngineOptions = {
  registry?: ProfileRegistry;
  planner?: VerificationPlanner;
  scheduler?: VerificationScheduler;
  runner?: VerificationRunner;
  history?: VerificationHistory;
  metrics?: VerificationMetrics;
};

export class VerificationEngine {
  private readonly registry: ProfileRegistry;
  private readonly planner: VerificationPlanner;
  private readonly scheduler: VerificationScheduler;
  private readonly runner: VerificationRunner;
  private readonly history: VerificationHistory;
  private readonly metrics: VerificationMetrics;
  private queue: VerificationQueueItem[] = [];
  private recentRuns: VerificationRunResult[] = [];
  private lastRunAt: string | null = null;

  constructor(options: VerificationEngineOptions = {}) {
    this.registry = options.registry ?? new ProfileRegistry();
    this.planner = options.planner ?? new VerificationPlanner();
    this.scheduler = options.scheduler ?? new VerificationScheduler();
    this.runner = options.runner ?? new VerificationRunner();
    this.history = options.history ?? new VerificationHistory();
    this.metrics = options.metrics ?? new VerificationMetrics();
  }

  registerProfile(profile: VerificationProfile): void {
    this.registry.register(profile);
  }

  getRegistry(): ProfileRegistry {
    return this.registry;
  }

  getHistory(): VerificationHistory {
    return this.history;
  }

  getMetrics(): VerificationMetrics {
    return this.metrics;
  }

  getQueue(): VerificationQueueItem[] {
    return [...this.queue];
  }

  getRecentRuns(): VerificationRunResult[] {
    return [...this.recentRuns];
  }

  getLastRunAt(): string | null {
    return this.lastRunAt;
  }

  planQueue(criteria?: Parameters<VerificationPlanner["plan"]>[1]): VerificationQueueItem[] {
    this.queue = this.planner.plan(this.registry.list(), criteria);
    this.metrics.setPendingQueue(this.queue.length);
    return this.getQueue();
  }

  async runVerification(profileId: string, correlationId?: string): Promise<VerificationRunResult> {
    const profile = this.registry.get(profileId);
    if (!profile) {
      throw new Error(`Perfil não encontrado: ${profileId}`);
    }

    const corr = correlationId ?? createCorrelationId(profileId, "verification");
    const result = await this.runner.run(profile, corr);

    if (result.status === "COMPLETED") {
      this.history.append({
        profileId: result.profileId,
        candidateId: result.candidateId,
        verifiedAt: new Date().toISOString(),
        verifiedBy: "verification-engine",
        decision: result.decision.outcome,
        classification: result.change.classification,
        previousVersion: profile.snapshot.version,
        newVersion: profile.snapshot.version + 1,
        changes: result.change.changes,
        sourcesConsulted: result.sourcesConsulted,
        correlationId: corr,
      });

      this.registry.markVerified(profileId, new Date().toISOString());
      this.metrics.recordRun(
        result.change.classification,
        result.latencyMs,
        isUpdateRequired(result.decision.outcome) ||
          requiresPublication(result.decision.outcome, result.change.classification),
      );
    }

    this.recentRuns.push(result);
    if (this.recentRuns.length > 50) {
      this.recentRuns.shift();
    }

    return result;
  }

  async runPlanned(): Promise<VerificationRunResult[]> {
    const queue = this.planQueue();
    const results: VerificationRunResult[] = [];

    for (const item of queue) {
      const result = await this.runVerification(item.profileId);
      results.push(result);
    }

    this.lastRunAt = new Date().toISOString();
    this.metrics.setPendingQueue(0);
    return results;
  }

  reschedule(profileId: string, frequency: VerificationProfile["verificationFrequency"]): void {
    const profile = this.registry.get(profileId);
    if (!profile) {
      return;
    }
    this.registry.register(this.scheduler.reschedule(profile, frequency));
  }

  reset(): void {
    this.registry.reset();
    this.history.reset();
    this.metrics.reset();
    this.queue = [];
    this.recentRuns = [];
    this.lastRunAt = null;
  }
}
