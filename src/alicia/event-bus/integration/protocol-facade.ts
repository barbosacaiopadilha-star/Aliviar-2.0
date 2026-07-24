import { ProtocolEngine } from "@/alicia/protocol-engine";

import { resolveCorrelationId } from "../correlation";
import type {
  ProtocolEvaluatedPayload,
  ProtocolStartedPayload,
  ReviewCaseCreatedPayload,
} from "../domain-events";
import type { EventBus } from "../event-bus";
import type { DomainEvent } from "../types";
import {
  getCandidateEvidence,
  getDiscoveredCandidate,
  mapDiscoveryToDoctorCandidate,
} from "./workflow-context";

export async function handleEvidenceCollected(
  bus: EventBus,
  event: DomainEvent<{ candidateId: string; evidenceCount: number }>,
): Promise<void> {
  const { candidateId } = event.payload;
  const candidate = getDiscoveredCandidate(candidateId);
  if (!candidate) {
    return;
  }

  const correlationId = resolveCorrelationId(candidateId, event.correlationId);

  await bus.publish<ProtocolStartedPayload>({
    eventType: "ProtocolStarted",
    aggregateId: candidateId,
    payload: { candidateId },
    correlationId,
    causationId: event.eventId,
    source: "protocol-facade",
  });

  const engine = new ProtocolEngine({ recordAudit: false });
  const doctorCandidate = mapDiscoveryToDoctorCandidate(candidate);
  const evidence = getCandidateEvidence(candidateId);
  const decision = engine.evaluate(doctorCandidate, evidence);

  await bus.publish<ProtocolEvaluatedPayload>({
    eventType: "ProtocolEvaluated",
    aggregateId: candidateId,
    payload: {
      candidateId,
      outcome: decision.outcome,
      suggestedNivel: decision.suggestedNivel,
    },
    correlationId,
    causationId: event.eventId,
    source: "protocol-facade",
  });

  if (decision.outcome !== "AUTO_PUBLISH") {
    await bus.publish<ReviewCaseCreatedPayload>({
      eventType: "ReviewCaseCreated",
      aggregateId: candidateId,
      payload: {
        candidateId,
        reason: decision.outcome,
        summary: decision.justification,
      },
      correlationId,
      causationId: event.eventId,
      source: "protocol-facade",
    });
  }
}
