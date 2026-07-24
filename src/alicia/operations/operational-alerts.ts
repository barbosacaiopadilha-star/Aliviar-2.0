import { BOTTLENECK_THRESHOLDS } from "./constants";
import type { OperationalAlert, PipelineAnalyticsSnapshot, RawOperationsInput } from "./types";
import { buildId } from "./utils";

export class OperationalAlerts {
  generate(
    input: RawOperationsInput,
    analytics: PipelineAnalyticsSnapshot,
    detectedAt: string,
    previousReviewCases = 0,
  ): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];

    for (const connector of input.connectors.connectors) {
      if (connector.health === "OFFLINE") {
        alerts.push({
          id: buildId("alert-offline"),
          type: "connector_offline",
          severity: "high",
          message: `Conector ${connector.name} está offline.`,
          detectedAt,
          metadata: { connectorId: connector.connectorId },
        });
      }
    }

    if (input.workflow.metrics.retryCount >= BOTTLENECK_THRESHOLDS.retryStormCount) {
      alerts.push({
        id: buildId("alert-retry"),
        type: "retry_storm",
        severity: "high",
        message: `Retry storm: ${input.workflow.metrics.retryCount} retries no Event Bus.`,
        detectedAt,
        stage: "publication",
        metadata: { retryCount: input.workflow.metrics.retryCount },
      });
    }

    if (input.workflow.dlqCount > 0) {
      alerts.push({
        id: buildId("alert-dlq"),
        type: "dlq_growth",
        severity: input.workflow.dlqCount >= 3 ? "high" : "medium",
        message: `DLQ com ${input.workflow.dlqCount} item(ns) pendente(s).`,
        detectedAt,
        metadata: { dlqCount: input.workflow.dlqCount },
      });
    }

    const pubFailed = input.workflow.metrics.eventsByType.PublicationFailed ?? 0;
    if (pubFailed > 0 || input.publication.failedCount > 0) {
      alerts.push({
        id: buildId("alert-pub-fail"),
        type: "publication_failure",
        severity: "high",
        message: `${pubFailed || input.publication.failedCount} falha(s) de publicação detectada(s).`,
        detectedAt,
        stage: "publication",
      });
    }

    if (input.protocol.rejectedCount > 0) {
      alerts.push({
        id: buildId("alert-proto-fail"),
        type: "protocol_failure",
        severity: "medium",
        message: `${input.protocol.rejectedCount} candidato(s) rejeitado(s) pelo protocolo.`,
        detectedAt,
        stage: "protocol",
      });
    }

    if (input.verification.failedRuns > 0) {
      alerts.push({
        id: buildId("alert-ver-fail"),
        type: "verification_failure",
        severity: "medium",
        message: `${input.verification.failedRuns} falha(s) de verificação.`,
        detectedAt,
        stage: "verification",
      });
    }

    const currentReviewCases =
      input.protocol.reviewCaseCount +
      input.publication.reviewCaseCount +
      input.verification.pendingReviewCount;

    if (
      previousReviewCases > 0 &&
      currentReviewCases >= previousReviewCases * BOTTLENECK_THRESHOLDS.reviewSpikeRatio
    ) {
      alerts.push({
        id: buildId("alert-review"),
        type: "review_spike",
        severity: "medium",
        message: `Pico de review cases: ${currentReviewCases} (anterior: ${previousReviewCases}).`,
        detectedAt,
        metadata: { current: currentReviewCases, previous: previousReviewCases },
      });
    }

    return alerts;
  }
}
