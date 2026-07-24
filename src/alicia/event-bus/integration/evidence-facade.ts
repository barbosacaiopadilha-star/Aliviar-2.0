import type { Evidence } from "@/alicia/protocol-engine";

import { resolveCorrelationId } from "../correlation";
import type {
  EvidenceCollectedPayload,
  EvidenceFailedPayload,
  EvidenceRequestedPayload,
} from "../domain-events";
import type { EventBus } from "../event-bus";
import {
  getDiscoveredCandidate,
  setCandidateEvidence,
} from "./workflow-context";

function buildEvidenceFromDiscovery(candidateId: string): Evidence[] {
  const candidate = getDiscoveredCandidate(candidateId);
  if (!candidate) {
    return [];
  }

  const evidence: Evidence[] = [];
  if (candidate.crm) {
    evidence.push({
      id: `ev-crm-${candidateId}`,
      name: `CRM-${candidate.crmUf} ${candidate.crm}`,
      type: "Registro profissional",
      level: 1,
      consultedAt: candidate.dataDescoberta,
      responsible: "Evidence Facade",
      supportsFields: ["crm", "identity", "specialty", "city"],
    });
  }

  if (candidate.urlOrigem) {
    evidence.push({
      id: `ev-url-${candidateId}`,
      name: candidate.urlOrigem,
      type: "Fonte institucional",
      level: 2,
      url: candidate.urlOrigem,
      consultedAt: candidate.dataDescoberta,
      responsible: "Evidence Facade",
      supportsFields: ["current_practice", "trajectory_milestone"],
    });
  }

  evidence.push({
    id: `ev-inst-${candidateId}`,
    name: `${candidate.especialidade} — ${candidate.cidade}`,
    type: "Instituição",
    level: 2,
    consultedAt: candidate.dataDescoberta,
    responsible: "Evidence Facade",
    supportsFields: ["specialty", "city"],
  });

  return evidence;
}

export async function handleEvidenceRequested(
  bus: EventBus,
  event: { payload: EvidenceRequestedPayload; eventId: string; correlationId: string },
): Promise<void> {
  const { candidateId } = event.payload;
  const correlationId = resolveCorrelationId(candidateId, event.correlationId);

  try {
    const evidence = buildEvidenceFromDiscovery(candidateId);
    if (evidence.length < 2) {
      throw new Error("Evidências insuficientes para o candidato.");
    }

    setCandidateEvidence(candidateId, evidence);

    await bus.publish<EvidenceCollectedPayload>({
      eventType: "EvidenceCollected",
      aggregateId: candidateId,
      payload: { candidateId, evidenceCount: evidence.length },
      correlationId,
      causationId: event.eventId,
      source: "evidence-facade",
    });
  } catch (error) {
    await bus.publish<EvidenceFailedPayload>({
      eventType: "EvidenceFailed",
      aggregateId: candidateId,
      payload: {
        candidateId,
        reason: error instanceof Error ? error.message : "Falha na coleta de evidências.",
      },
      correlationId,
      causationId: event.eventId,
      source: "evidence-facade",
    });
  }
}
