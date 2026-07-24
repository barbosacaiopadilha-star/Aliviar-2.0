import type { FactoryMetricsSnapshot, FactoryRun, FactoryRunReport } from "./types";

export class FactoryMetrics {
  private totalRuns = 0;
  private completedRuns = 0;
  private failedRuns = 0;
  private dryRuns = 0;
  private totalDurationMs = 0;
  private profilesPublished = 0;
  private reviewCases = 0;
  private failures = 0;
  private retries = 0;
  private rollbacks = 0;
  private verifications = 0;
  private lastRunAt: string | null = null;

  recordRun(run: FactoryRun): void {
    this.totalRuns += 1;
    this.lastRunAt = run.finishedAt ?? run.startedAt;

    if (run.dryRun) {
      this.dryRuns += 1;
    } else if (run.status === "COMPLETED") {
      this.completedRuns += 1;
    } else if (run.status === "FAILED") {
      this.failedRuns += 1;
    }

    if (run.durationMs) {
      this.totalDurationMs += run.durationMs;
    }

    this.profilesPublished += run.published;
    this.reviewCases += run.reviewCases;
    this.failures += run.errors.length;
  }

  recordRetry(): void {
    this.retries += 1;
  }

  recordRollback(): void {
    this.rollbacks += 1;
  }

  recordVerification(): void {
    this.verifications += 1;
  }

  snapshot(): FactoryMetricsSnapshot {
    return {
      totalRuns: this.totalRuns,
      completedRuns: this.completedRuns,
      failedRuns: this.failedRuns,
      dryRuns: this.dryRuns,
      averageDurationMs:
        this.totalRuns === 0 ? 0 : Math.round(this.totalDurationMs / this.totalRuns),
      profilesPublished: this.profilesPublished,
      reviewCases: this.reviewCases,
      failures: this.failures,
      retries: this.retries,
      rollbacks: this.rollbacks,
      verifications: this.verifications,
      lastRunAt: this.lastRunAt,
    };
  }

  reset(): void {
    this.totalRuns = 0;
    this.completedRuns = 0;
    this.failedRuns = 0;
    this.dryRuns = 0;
    this.totalDurationMs = 0;
    this.profilesPublished = 0;
    this.reviewCases = 0;
    this.failures = 0;
    this.retries = 0;
    this.rollbacks = 0;
    this.verifications = 0;
    this.lastRunAt = null;
  }
}

export class FactoryReportBuilder {
  build(input: {
    run: FactoryRun;
    failures: Array<{ candidateId: string; error: string; stage: string }>;
    reviewRate?: number;
    publicationRate?: number;
    connectorHealth?: number;
    bottlenecks?: string[];
  }): FactoryRunReport {
    const { run } = input;
    const byStage = {} as FactoryRunReport["latencies"]["byStage"];

    for (const checkpoint of run.checkpoints) {
      const prev = run.checkpoints[run.checkpoints.indexOf(checkpoint) - 1];
      const start = prev
        ? new Date(prev.completedAt).getTime()
        : new Date(run.startedAt).getTime();
      byStage[checkpoint.stage] = new Date(checkpoint.completedAt).getTime() - start;
    }

    const protocolTotal = run.published + run.reviewCases;
    const reviewRate =
      input.reviewRate ??
      (protocolTotal === 0 ? 0 : Math.round((run.reviewCases / protocolTotal) * 1000) / 1000);
    const publicationRate =
      input.publicationRate ??
      (run.candidatesFound === 0
        ? 0
        : Math.round((run.published / run.candidatesFound) * 1000) / 1000);

    return {
      runId: run.runId,
      generatedAt: new Date().toISOString(),
      durationMs: run.durationMs ?? 0,
      dryRun: run.dryRun,
      kpis: {
        candidatesFound: run.candidatesFound,
        evidencePackages: run.evidencePackages,
        published: run.published,
        reviewCases: run.reviewCases,
        failures: run.errors.length,
        warnings: run.warnings.length,
      },
      latencies: {
        totalMs: run.durationMs ?? 0,
        byStage,
      },
      reviewRate,
      publicationRate,
      connectorHealth: input.connectorHealth ?? 1,
      bottlenecks: input.bottlenecks ?? [],
      failures: input.failures,
      warnings: run.warnings,
    };
  }
}
