import type { PipelineStageMetrics, PipelineStageId, RawOperationsInput } from "./types";
import { successRate } from "./utils";

export class PipelineStageCollector {
  collect(input: RawOperationsInput): PipelineStageMetrics[] {
    const discoverySuccess = input.discovery.metrics.sourcesExecuted - input.discovery.metrics.sourceFailures;

    const discovery: PipelineStageMetrics = {
      stage: "discovery",
      input: input.discovery.metrics.candidatesFound,
      output: input.discovery.metrics.readyForEvidence,
      averageLatencyMs: input.discovery.metrics.averageDurationMs,
      successRate: successRate(
        discoverySuccess,
        input.discovery.metrics.sourcesExecuted,
      ),
      queueSize: input.discovery.queueSize,
      failures: input.discovery.metrics.sourceFailures,
    };

    const evidenceTotal =
      input.evidence.metrics.packagesCreated + input.evidence.metrics.packagesRejected;

    const evidence: PipelineStageMetrics = {
      stage: "evidence",
      input: input.evidence.metrics.candidatesProcessed,
      output: input.evidence.metrics.packagesCreated,
      averageLatencyMs: input.connectors.metrics.averageLatencyMs,
      successRate: successRate(input.evidence.metrics.packagesCreated, evidenceTotal),
      queueSize: 0,
      failures: input.evidence.metrics.packagesRejected,
    };

    const protocolInput = input.workflow.metrics.eventsByType.ProtocolStarted ?? 0;
    const protocolOutput = input.workflow.metrics.eventsByType.ProtocolEvaluated ?? 0;

    const protocol: PipelineStageMetrics = {
      stage: "protocol",
      input: protocolInput || input.protocol.auditCount,
      output: protocolOutput || input.protocol.auditCount,
      averageLatencyMs: input.workflow.metrics.averageProcessingMs,
      successRate: successRate(
        input.protocol.approvedCount,
        input.protocol.approvedCount + input.protocol.rejectedCount,
      ),
      queueSize: input.protocol.reviewCaseCount,
      failures: input.protocol.rejectedCount,
    };

    const pubRequested = input.workflow.metrics.eventsByType.PublicationRequested ?? 0;
    const pubSucceeded = input.workflow.metrics.eventsByType.PublicationSucceeded ?? 0;
    const pubFailed = input.workflow.metrics.eventsByType.PublicationFailed ?? 0;

    const publication: PipelineStageMetrics = {
      stage: "publication",
      input: pubRequested || input.publication.publishedCount + input.publication.failedCount,
      output: pubSucceeded || input.publication.publishedCount,
      averageLatencyMs: input.workflow.metrics.averageProcessingMs,
      successRate: successRate(
        pubSucceeded || input.publication.publishedCount,
        (pubSucceeded || input.publication.publishedCount) +
          (pubFailed || input.publication.failedCount),
      ),
      queueSize: input.publication.reviewCaseCount,
      failures: pubFailed || input.publication.failedCount,
    };

    const verRequested = input.workflow.metrics.eventsByType.VerificationRequested ?? 0;
    const verCompleted = input.workflow.metrics.eventsByType.VerificationCompleted ?? 0;
    const verFailed = input.verification.failedRuns;

    const verification: PipelineStageMetrics = {
      stage: "verification",
      input: verRequested || input.verification.completedRuns + verFailed,
      output: verCompleted || input.verification.completedRuns,
      averageLatencyMs: input.verification.metrics.averageLatencyMs,
      successRate: successRate(
        input.verification.completedRuns,
        input.verification.completedRuns + verFailed,
      ),
      queueSize: input.verification.metrics.pendingQueue,
      failures: verFailed,
    };

    return [discovery, evidence, protocol, publication, verification];
  }
}
