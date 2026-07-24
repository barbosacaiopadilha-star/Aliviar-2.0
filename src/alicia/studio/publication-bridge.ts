import { evaluateEvidence, decidePublication } from "@/alicia/protocol-engine";
import {
  mapStudioCandidateToDoctorCandidate,
  mapStudioSourcesToEvidence,
} from "@/alicia/protocol-engine/studio-adapter";
import {
  PublicationPipeline,
  type PipelineInput,
  type PipelineResult,
  type PipelineReviewCase,
} from "@/alicia/publication-pipeline";

import type { StudioCandidate } from "./types";

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

export function studioCandidateToPipelineInput(
  candidate: StudioCandidate,
  ids?: { protocolDecisionId?: string; evidenceReportId?: string },
): PipelineInput {
  const studioInput = toStudioInput(candidate);
  const doctorCandidate = mapStudioCandidateToDoctorCandidate(studioInput);
  const evidence = mapStudioSourcesToEvidence(studioInput.sources);
  const evidenceReport = evaluateEvidence(doctorCandidate, evidence);
  const decision = decidePublication(doctorCandidate, evidence, evidenceReport);

  return {
    candidate: doctorCandidate,
    evidence,
    decision,
    protocolDecisionId: ids?.protocolDecisionId ?? `pd-${candidate.id}`,
    evidenceReportId: ids?.evidenceReportId ?? `er-${candidate.id}`,
  };
}

let sessionPipeline: PublicationPipeline | null = null;

export function getSessionPublicationPipeline(): PublicationPipeline {
  if (!sessionPipeline) {
    sessionPipeline = new PublicationPipeline();
  }
  return sessionPipeline;
}

export function resetSessionPublicationPipeline(): void {
  sessionPipeline = null;
}

export function runStudioPublication(
  candidate: StudioCandidate,
  pipeline: PublicationPipeline = getSessionPublicationPipeline(),
): PipelineResult {
  return pipeline.execute(studioCandidateToPipelineInput(candidate));
}

export function getPublicationReviewCases(
  candidates: StudioCandidate[],
  pipeline: PublicationPipeline = getSessionPublicationPipeline(),
): PipelineReviewCase[] {
  return candidates
    .map((candidate) => {
      const input = studioCandidateToPipelineInput(candidate);
      if (input.decision.outcome !== "AUTO_PUBLISH") {
        return null;
      }

      const result = pipeline.execute(input);
      return result.reviewCase ?? null;
    })
    .filter((reviewCase): reviewCase is PipelineReviewCase => Boolean(reviewCase));
}

export const PUBLICATION_PIPELINE_REASON_LABELS = {
  PUBLICATION_BLOCKED: "Publicação bloqueada no preflight",
  PUBLICATION_INCONSISTENT: "Inconsistência pós-publicação",
  MATERIAL_UPDATE: "Atualização material",
  REVIEW_REQUIRED: "Revisão necessária",
  ROLLBACK_FAILED: "Falha no rollback",
  NOT_AUTO_PUBLISH: "Decisão não é AUTO_PUBLISH",
} as const;
