import { evaluateEvidence, decidePublication } from "@/alicia/protocol-engine";
import { PublicationPipeline } from "@/alicia/publication-pipeline";

import { resolveCorrelationId } from "../correlation";
import type {
  PublicationFailedPayload,
  PublicationRequestedPayload,
  PublicationRolledBackPayload,
  PublicationStartedPayload,
  PublicationSucceededPayload,
  ReviewCaseCreatedPayload,
} from "../domain-events";
import type { EventBus } from "../event-bus";
import type { DomainEvent } from "../types";
import {
  getCandidateEvidence,
  getDiscoveredCandidate,
  mapDiscoveryToDoctorCandidate,
} from "./workflow-context";

export async function handlePublicationRequested(
  bus: EventBus,
  pipeline: PublicationPipeline,
  event: DomainEvent<PublicationRequestedPayload>,
): Promise<void> {
  const { candidateId, protocolDecisionId } = event.payload;
  const candidate = getDiscoveredCandidate(candidateId);
  if (!candidate) {
    return;
  }

  const correlationId = resolveCorrelationId(candidateId, event.correlationId);
  const doctorCandidate = mapDiscoveryToDoctorCandidate(candidate);
  const evidence = getCandidateEvidence(candidateId);
  const evidenceReport = evaluateEvidence(doctorCandidate, evidence);
  const decision = decidePublication(doctorCandidate, evidence, evidenceReport);

  await bus.publish<PublicationStartedPayload>({
    eventType: "PublicationStarted",
    aggregateId: candidateId,
    payload: { candidateId },
    correlationId,
    causationId: event.eventId,
    source: "publication-facade",
  });

  const result = pipeline.execute({
    candidate: doctorCandidate,
    evidence,
    decision,
    protocolDecisionId,
    evidenceReportId: `er-${candidateId}`,
  });

  if (result.status === "PUBLISHED" || result.status === "ALREADY_PUBLISHED") {
    await bus.publish<PublicationSucceededPayload>({
      eventType: "PublicationSucceeded",
      aggregateId: candidateId,
      payload: {
        candidateId,
        status: result.status,
        snapshotId: result.snapshotId,
      },
      correlationId,
      causationId: event.eventId,
      source: "publication-facade",
    });
    return;
  }

  if (result.status === "ROLLBACK_EXECUTED") {
    await bus.publish<PublicationRolledBackPayload>({
      eventType: "PublicationRolledBack",
      aggregateId: candidateId,
      payload: {
        candidateId,
        snapshotId: result.snapshotId,
        reason: result.message ?? "Rollback executado.",
      },
      correlationId,
      causationId: event.eventId,
      source: "publication-facade",
    });

    if (result.reviewCase) {
      await bus.publish<ReviewCaseCreatedPayload>({
        eventType: "ReviewCaseCreated",
        aggregateId: candidateId,
        payload: {
          candidateId,
          reason: result.reviewCase.reason,
          summary: result.reviewCase.summary,
        },
        correlationId,
        causationId: event.eventId,
        source: "publication-facade",
      });
    }
    return;
  }

  await bus.publish<PublicationFailedPayload>({
    eventType: "PublicationFailed",
    aggregateId: candidateId,
    payload: {
      candidateId,
      status: result.status,
      message: result.message,
    },
    correlationId,
    causationId: event.eventId,
    source: "publication-facade",
  });

  if (result.reviewCase) {
    await bus.publish<ReviewCaseCreatedPayload>({
      eventType: "ReviewCaseCreated",
      aggregateId: candidateId,
      payload: {
        candidateId,
        reason: result.reviewCase.reason,
        summary: result.reviewCase.summary,
      },
      correlationId,
      causationId: event.eventId,
      source: "publication-facade",
    });
  }
}
