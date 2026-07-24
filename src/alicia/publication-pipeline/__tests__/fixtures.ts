import { createCandidate, createMinimumEvidence } from "@/alicia/protocol-engine/__tests__/fixtures";
import { evaluateEvidence, decidePublication } from "@/alicia/protocol-engine";
import type { DoctorCandidate, Evidence, PublicationDecision } from "@/alicia/protocol-engine";

import type { PipelineInput } from "../types";

export function createAutoPublishDecision(
  candidateOverrides: Partial<DoctorCandidate> = {},
  evidence: Evidence[] = createMinimumEvidence(),
): { candidate: DoctorCandidate; evidence: Evidence[]; decision: PublicationDecision } {
  const candidate = createCandidate({
    graduation: { institution: "EMESCAM", verified: false },
    residency: [{ institution: "ICOT", program: "Ortopedia", verified: true }],
    ...candidateOverrides,
  });
  const evidenceReport = evaluateEvidence(candidate, evidence);
  const decision = decidePublication(candidate, evidence, evidenceReport);

  if (decision.outcome !== "AUTO_PUBLISH") {
    throw new Error(`Fixture esperava AUTO_PUBLISH, obteve ${decision.outcome}`);
  }

  return { candidate, evidence, decision };
}

export function createPipelineInput(
  candidateOverrides: Partial<DoctorCandidate> = {},
  evidence: Evidence[] = createMinimumEvidence(),
  ids?: { protocolDecisionId?: string; evidenceReportId?: string },
): PipelineInput {
  const { candidate, evidence: resolvedEvidence, decision } = createAutoPublishDecision(
    candidateOverrides,
    evidence,
  );

  return {
    candidate,
    evidence: resolvedEvidence,
    decision,
    protocolDecisionId: ids?.protocolDecisionId ?? "pd-test-1",
    evidenceReportId: ids?.evidenceReportId ?? "er-test-1",
  };
}

export function createHumanReviewInput(): PipelineInput {
  const candidate = createCandidate({ crm: "", crmStatus: "unknown" });
  const evidence = createMinimumEvidence();
  const evidenceReport = evaluateEvidence(candidate, evidence);
  const decision = decidePublication(candidate, evidence, evidenceReport);

  return {
    candidate,
    evidence,
    decision,
    protocolDecisionId: "pd-human-review",
    evidenceReportId: "er-human-review",
  };
}

export function createRejectInput(): PipelineInput {
  const candidate = createCandidate({ specialty: "Dermatologia" });
  const evidence = createMinimumEvidence();
  const evidenceReport = evaluateEvidence(candidate, evidence);
  const decision = decidePublication(candidate, evidence, evidenceReport);

  return {
    candidate,
    evidence,
    decision,
    protocolDecisionId: "pd-reject",
    evidenceReportId: "er-reject",
  };
}
