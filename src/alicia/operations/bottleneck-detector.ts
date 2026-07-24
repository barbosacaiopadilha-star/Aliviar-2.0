import { BOTTLENECK_THRESHOLDS } from "./constants";
import type {
  Bottleneck,
  PipelineAnalyticsSnapshot,
  PipelineStageMetrics,
  RawOperationsInput,
} from "./types";
import { buildId } from "./utils";

export class BottleneckDetector {
  detect(
    stages: PipelineStageMetrics[],
    analytics: PipelineAnalyticsSnapshot,
    input: RawOperationsInput,
    previousBacklog: number,
    detectedAt: string,
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    const slowest = [...stages].sort(
      (a, b) => b.averageLatencyMs - a.averageLatencyMs,
    )[0];

    if (
      slowest &&
      slowest.averageLatencyMs >= BOTTLENECK_THRESHOLDS.slowStageLatencyMs
    ) {
      bottlenecks.push({
        id: buildId("bn-slow"),
        type: "slow_stage",
        severity: "high",
        stage: slowest.stage,
        message: `Etapa ${slowest.stage} com latência média de ${slowest.averageLatencyMs}ms.`,
        detectedAt,
        value: slowest.averageLatencyMs,
        threshold: BOTTLENECK_THRESHOLDS.slowStageLatencyMs,
      });
    }

    if (
      previousBacklog > 0 &&
      analytics.backlog >= previousBacklog * BOTTLENECK_THRESHOLDS.queueGrowthRatio
    ) {
      bottlenecks.push({
        id: buildId("bn-queue"),
        type: "growing_queue",
        severity: "medium",
        message: `Backlog cresceu de ${previousBacklog} para ${analytics.backlog}.`,
        detectedAt,
        value: analytics.backlog,
        threshold: previousBacklog * BOTTLENECK_THRESHOLDS.queueGrowthRatio,
      });
    }

    for (const connector of input.connectors.connectors) {
      if (
        connector.health === "DEGRADED" ||
        connector.availability < BOTTLENECK_THRESHOLDS.connectorDegradedAvailability
      ) {
        bottlenecks.push({
          id: buildId(`bn-conn-${connector.connectorId}`),
          type: "degraded_connector",
          severity: connector.health === "OFFLINE" ? "high" : "medium",
          message: `Conector ${connector.name} está ${connector.health.toLowerCase()} (${(connector.availability * 100).toFixed(0)}% disponibilidade).`,
          detectedAt,
          value: connector.availability,
          threshold: BOTTLENECK_THRESHOLDS.connectorDegradedAvailability,
        });
      }
    }

    if (input.workflow.metrics.retryCount >= BOTTLENECK_THRESHOLDS.retryStormCount) {
      bottlenecks.push({
        id: buildId("bn-retry"),
        type: "excessive_retries",
        severity: "high",
        message: `${input.workflow.metrics.retryCount} retries detectados no Event Bus.`,
        detectedAt,
        value: input.workflow.metrics.retryCount,
        threshold: BOTTLENECK_THRESHOLDS.retryStormCount,
      });
    }

    if (input.workflow.dlqCount >= BOTTLENECK_THRESHOLDS.dlqGrowthCount) {
      bottlenecks.push({
        id: buildId("bn-dlq"),
        type: "dlq_growing",
        severity: "high",
        message: `DLQ com ${input.workflow.dlqCount} item(ns).`,
        detectedAt,
        value: input.workflow.dlqCount,
        threshold: BOTTLENECK_THRESHOLDS.dlqGrowthCount,
      });
    }

    const avgLatency =
      stages.length === 0
        ? 0
        : stages.reduce((s, st) => s + st.averageLatencyMs, 0) / stages.length;

    if (
      analytics.p95LatencyMs >
      avgLatency * BOTTLENECK_THRESHOLDS.abnormalLatencyMultiplier
    ) {
      bottlenecks.push({
        id: buildId("bn-latency"),
        type: "abnormal_latency",
        severity: "medium",
        message: `P95 (${analytics.p95LatencyMs}ms) excede 2× a média (${Math.round(avgLatency)}ms).`,
        detectedAt,
        value: analytics.p95LatencyMs,
        threshold: avgLatency * BOTTLENECK_THRESHOLDS.abnormalLatencyMultiplier,
      });
    }

    return bottlenecks;
  }
}
