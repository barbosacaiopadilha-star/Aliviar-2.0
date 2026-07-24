import { BottleneckDetector } from "./bottleneck-detector";
import { OperationalAlerts } from "./operational-alerts";
import { OperationalKpisCalculator } from "./operational-kpis";
import { OperationalTimelineBuilder } from "./operational-timeline";
import { OperationsHistory } from "./operations-history";
import { collectOperationsInput } from "./operations-data-collector";
import { PipelineAnalytics } from "./pipeline-analytics";
import { PipelineStageCollector } from "./pipeline-stage-collector";
import type {
  ConnectorHealthSummary,
  DailyOperationsSnapshot,
  OperationsCenterSnapshot,
  OperationsHealthSummary,
  RawOperationsInput,
} from "./types";
import { todayDateKey } from "./utils";

export type OperationsEngineOptions = {
  stageCollector?: PipelineStageCollector;
  analytics?: PipelineAnalytics;
  bottleneckDetector?: BottleneckDetector;
  kpisCalculator?: OperationalKpisCalculator;
  timelineBuilder?: OperationalTimelineBuilder;
  alerts?: OperationalAlerts;
  history?: OperationsHistory;
};

export class OperationsEngine {
  private readonly stageCollector: PipelineStageCollector;
  private readonly analytics: PipelineAnalytics;
  private readonly bottleneckDetector: BottleneckDetector;
  private readonly kpisCalculator: OperationalKpisCalculator;
  private readonly timelineBuilder: OperationalTimelineBuilder;
  private readonly alerts: OperationalAlerts;
  private readonly history: OperationsHistory;
  private lastSnapshot: OperationsCenterSnapshot | null = null;
  private previousReviewCases = 0;

  constructor(options: OperationsEngineOptions = {}) {
    this.stageCollector = options.stageCollector ?? new PipelineStageCollector();
    this.analytics = options.analytics ?? new PipelineAnalytics();
    this.bottleneckDetector = options.bottleneckDetector ?? new BottleneckDetector();
    this.kpisCalculator = options.kpisCalculator ?? new OperationalKpisCalculator();
    this.timelineBuilder = options.timelineBuilder ?? new OperationalTimelineBuilder();
    this.alerts = options.alerts ?? new OperationalAlerts();
    this.history = options.history ?? new OperationsHistory();
  }

  getHistory(): OperationsHistory {
    return this.history;
  }

  getLastSnapshot(): OperationsCenterSnapshot | null {
    return this.lastSnapshot;
  }

  buildFromInput(input: RawOperationsInput): OperationsCenterSnapshot {
    const detectedAt = new Date().toISOString();
    const stages = this.stageCollector.collect(input);
    const previousBacklog = this.analytics.getPreviousBacklog();
    const analytics = this.analytics.compute(stages, input);
    const kpis = this.kpisCalculator.compute(input, analytics);
    const timelines = this.timelineBuilder.build(input.workflow.events);
    const bottlenecks = this.bottleneckDetector.detect(
      stages,
      analytics,
      input,
      previousBacklog,
      detectedAt,
    );
    const alerts = this.alerts.generate(
      input,
      analytics,
      detectedAt,
      this.previousReviewCases,
    );
    const health = this.computeHealth(input);

    const connectorHealth: ConnectorHealthSummary[] = input.connectors.connectors.map(
      (c) => ({
        connectorId: c.connectorId,
        name: c.name,
        availability: c.availability,
        health: c.health,
        averageLatencyMs: c.averageLatencyMs,
      }),
    );

    const dailySnapshot: DailyOperationsSnapshot = {
      date: todayDateKey(),
      capturedAt: detectedAt,
      kpis,
      analytics,
      reviewRate: analytics.reviewRate,
      publicationRate: analytics.publicationRate,
      connectorHealth,
      stageMetrics: stages,
    };

    this.history.record(dailySnapshot);
    this.previousReviewCases = kpis.reviewCases;

    const snapshot: OperationsCenterSnapshot = {
      dashboard: stages,
      analytics,
      kpis,
      timelines,
      bottlenecks,
      alerts,
      health,
      history: this.history.list(),
      lastRefreshedAt: detectedAt,
    };

    this.lastSnapshot = snapshot;
    return snapshot;
  }

  async refresh(options: { refresh?: boolean } = {}): Promise<OperationsCenterSnapshot> {
    const input = await collectOperationsInput(options);
    return this.buildFromInput(input);
  }

  private computeHealth(input: RawOperationsInput): OperationsHealthSummary {
    const offlineConnectors = input.connectors.connectors.filter(
      (c) => c.health === "OFFLINE",
    ).length;
    const degradedConnectors = input.connectors.connectors.filter(
      (c) => c.health === "DEGRADED",
    ).length;

    let overall: OperationsHealthSummary["overall"] = "healthy";
    if (offlineConnectors > 0 || input.workflow.dlqCount >= 3) {
      overall = "critical";
    } else if (degradedConnectors > 0 || input.workflow.metrics.retryCount >= 3) {
      overall = "degraded";
    }

    return {
      overall,
      connectorAvailability: input.connectors.metrics.availability,
      dlqCount: input.workflow.dlqCount,
      pendingRetries: input.workflow.pendingRetries,
      degradedConnectors,
      offlineConnectors,
    };
  }

  reset(): void {
    this.analytics.reset();
    this.lastSnapshot = null;
    this.previousReviewCases = 0;
  }
}
