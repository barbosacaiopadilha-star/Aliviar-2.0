import type { PIPELINE_STAGES } from "./constants";
import type {
  PipelineAnalyticsSnapshot,
  PipelineStageId,
  PipelineStageMetrics,
  RawOperationsInput,
} from "./types";
import { percentile } from "./utils";

export class PipelineAnalytics {
  private readonly latencySamples: number[] = [];
  private previousBacklog = 0;

  recordLatency(latencyMs: number): void {
    if (latencyMs > 0) {
      this.latencySamples.push(latencyMs);
    }
  }

  setPreviousBacklog(backlog: number): void {
    this.previousBacklog = backlog;
  }

  getPreviousBacklog(): number {
    return this.previousBacklog;
  }

  compute(
    stages: PipelineStageMetrics[],
    input: RawOperationsInput,
  ): PipelineAnalyticsSnapshot {
    const stageLatencies = {} as Record<PipelineStageId, number>;
    for (const stage of stages) {
      stageLatencies[stage.stage] = stage.averageLatencyMs;
      this.recordLatency(stage.averageLatencyMs);
    }

    const totalLatencyMs = stages.reduce((sum, s) => sum + s.averageLatencyMs, 0);
    const backlog = stages.reduce((sum, s) => sum + s.queueSize, 0);

    const eventsPublished = input.workflow.metrics.eventsPublished;
    const throughputPerHour = eventsPublished;

    const protocolTotal = input.protocol.approvedCount + input.protocol.rejectedCount;
    const reviewCases =
      input.protocol.reviewCaseCount +
      input.publication.reviewCaseCount +
      input.verification.pendingReviewCount;

    const reviewRate =
      protocolTotal === 0 ? 0 : Math.round((reviewCases / protocolTotal) * 1000) / 1000;

    const pubTotal =
      (input.workflow.metrics.eventsByType.PublicationSucceeded ?? 0) +
      (input.workflow.metrics.eventsByType.PublicationFailed ?? 0);
    const publicationRate =
      pubTotal === 0
        ? 0
        : Math.round(
            ((input.workflow.metrics.eventsByType.PublicationSucceeded ?? 0) / pubTotal) *
              1000,
          ) / 1000;

    this.setPreviousBacklog(backlog);

    return {
      stageLatencies,
      totalLatencyMs,
      p95LatencyMs: percentile(this.latencySamples, 95),
      p99LatencyMs: percentile(this.latencySamples, 99),
      throughputPerHour,
      backlog,
      reviewRate,
      publicationRate,
    };
  }

  getLatencySamples(): number[] {
    return [...this.latencySamples];
  }

  reset(): void {
    this.latencySamples.length = 0;
    this.previousBacklog = 0;
  }
}
