import type { OperationalKpis, PipelineAnalyticsSnapshot, RawOperationsInput } from "./types";
import { todayDateKey } from "./utils";

export class OperationalKpisCalculator {
  compute(input: RawOperationsInput, analytics: PipelineAnalyticsSnapshot): OperationalKpis {
    const reviewCases =
      input.protocol.reviewCaseCount +
      input.publication.reviewCaseCount +
      input.verification.pendingReviewCount;

    const profilesUpdated =
      input.workflow.metrics.eventsByType.ProfileChanged ?? 0;

    return {
      date: todayDateKey(),
      candidatesFound: input.discovery.metrics.candidatesFound,
      evidencePackages: input.evidence.packageCount,
      protocolApproved: input.protocol.approvedCount,
      protocolRejected: input.protocol.rejectedCount,
      reviewCases,
      profilesPublished: input.publication.publishedCount,
      profilesUpdated,
      profilesReverified: input.verification.metrics.profilesVerified,
      connectorAvailability: input.connectors.metrics.availability,
    };
  }
}
