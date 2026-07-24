import { getConnectorMonitorSnapshot } from "@/alicia/connectors/studio-adapter";
import { getDiscoveryInboxSnapshot } from "@/alicia/discovery/studio-adapter";
import { getEvidenceExplorerSnapshot } from "@/alicia/evidence-acquisition/studio-adapter";
import { getWorkflowMonitorSnapshot } from "@/alicia/event-bus/studio-adapter";
import { globalAuditTrail } from "@/alicia/protocol-engine";
import { globalPublicationAuditTrail } from "@/alicia/publication-pipeline";
import { getVerificationCenterSnapshot } from "@/alicia/verification/studio-adapter";

import type { RawOperationsInput } from "./types";

function countProtocolOutcomes(): {
  approved: number;
  rejected: number;
  reviewCases: number;
} {
  const entries = globalAuditTrail.list();
  let approved = 0;
  let rejected = 0;
  let reviewCases = 0;

  for (const entry of entries) {
    if (entry.decision === "AUTO_PUBLISH") {
      approved += 1;
    } else if (entry.decision === "REJECT") {
      rejected += 1;
    } else if (entry.decision === "HUMAN_REVIEW") {
      reviewCases += 1;
    }
  }

  return { approved, rejected, reviewCases };
}

function countPublicationOutcomes(): {
  published: number;
  failed: number;
  reviewCases: number;
} {
  const events = globalPublicationAuditTrail.list();
  let published = 0;
  let failed = 0;
  let reviewCases = 0;

  for (const event of events) {
    if (event.type === "PROFILE_PUBLISHED") {
      published += 1;
    } else if (event.type === "PUBLICATION_FAILED") {
      failed += 1;
    } else if (event.type === "PREFLIGHT_BLOCKED") {
      reviewCases += 1;
    }
  }

  return { published, failed, reviewCases };
}

export async function collectOperationsInput(
  options: { refresh?: boolean } = {},
): Promise<RawOperationsInput> {
  const [discovery, evidence, connectors, workflow, verification] = await Promise.all([
    getDiscoveryInboxSnapshot(options),
    getEvidenceExplorerSnapshot(options),
    getConnectorMonitorSnapshot(options),
    getWorkflowMonitorSnapshot(options),
    getVerificationCenterSnapshot(options),
  ]);

  const protocol = countProtocolOutcomes();
  const publication = countPublicationOutcomes();

  const connectorAvailability =
    connectors.connectors.length === 0
      ? 1
      : connectors.connectors.reduce((sum, c) => sum + c.availability, 0) /
        connectors.connectors.length;

  const verificationFailed = verification.recentRuns.filter(
    (run) => run.status === "FAILED",
  ).length;
  const verificationCompleted = verification.recentRuns.filter(
    (run) => run.status === "COMPLETED",
  ).length;

  return {
    discovery: {
      metrics: discovery.metrics,
      queueSize: discovery.items.length,
    },
    evidence: {
      metrics: evidence.metrics,
      packageCount: evidence.packages.length,
    },
    connectors: {
      metrics: {
        ...connectors.metrics,
        availability: connectorAvailability,
      },
      connectors: connectors.connectors.map((c) => ({
        connectorId: c.connectorId,
        name: c.name,
        health: c.health,
        availability: c.availability,
        averageLatencyMs: c.averageLatencyMs,
      })),
      retryQueueSize: connectors.retryQueue.length,
    },
    workflow: {
      metrics: workflow.metrics,
      dlqCount: workflow.dlq.length,
      pendingRetries: workflow.pendingRetries.length,
      events: workflow.timeline.map((entry) => ({
        eventType: entry.event.eventType,
        aggregateId: entry.event.aggregateId,
        timestamp: entry.event.timestamp,
        correlationId: entry.event.correlationId,
        source: entry.event.source,
        payload: entry.event.payload,
      })),
    },
    verification: {
      metrics: verification.metrics,
      pendingReviewCount: verification.pendingReview.length,
      failedRuns: verificationFailed,
      completedRuns: verificationCompleted,
    },
    protocol: {
      auditCount: globalAuditTrail.size,
      approvedCount: protocol.approved,
      rejectedCount: protocol.rejected,
      reviewCaseCount: protocol.reviewCases,
    },
    publication: {
      publishedCount: publication.published,
      failedCount: publication.failed,
      reviewCaseCount: publication.reviewCases,
    },
  };
}
