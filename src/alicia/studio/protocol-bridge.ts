import type { PublicationDecision, ReviewCase } from "@/alicia/protocol-engine";
import {
  collectReviewCases,
  evaluateStudioCandidate,
  getSuggestedOperationalLevel,
} from "@/alicia/protocol-engine";

import type { StudioCandidate } from "./types";

export type StudioProtocolEvaluation = {
  decision: PublicationDecision;
  suggestedNivel?: "A" | "B";
  isReviewCase: boolean;
};

function toStudioInput(candidate: StudioCandidate) {
  return {
    id: candidate.id,
    caseId: candidate.caseId,
    name: candidate.name,
    crm: candidate.crm,
    rqe: candidate.rqe,
    city: candidate.city,
    specialty: candidate.specialty,
    sources: candidate.sources,
    pendencies: candidate.pendencies,
    collectedBy: candidate.history[0]?.actor,
    collectedAt: candidate.createdAt,
  };
}

export function evaluateCandidateProtocol(candidate: StudioCandidate): StudioProtocolEvaluation {
  const decision = evaluateStudioCandidate(toStudioInput(candidate));
  const suggestedNivel = getSuggestedOperationalLevel(toStudioInput(candidate));

  return {
    decision,
    suggestedNivel,
    isReviewCase: decision.outcome !== "AUTO_PUBLISH",
  };
}

export function getStudioReviewCases(candidates: StudioCandidate[]): ReviewCase[] {
  return collectReviewCases(candidates.map(toStudioInput));
}

export const PUBLICATION_OUTCOME_LABELS = {
  AUTO_PUBLISH: "Publicação automática",
  HUMAN_REVIEW: "Revisão humana",
  REJECT: "Rejeitado",
} as const;
