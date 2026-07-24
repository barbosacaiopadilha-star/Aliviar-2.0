import { CRM_PATTERN, RQE_PATTERN, TEOT_PATTERN } from "./constants";
import { enrichEvidence } from "./source-levels";
import type { CrmStatus, DoctorCandidate, Evidence, PublicationDecision, ReviewCase } from "./types";
import { evaluateCandidate } from "./protocol-engine";

type StudioSourceInput = {
  id: string;
  name: string;
  type: string;
  url?: string;
  consultedAt: string;
  responsible: string;
};

type StudioCandidateInput = {
  id: string;
  caseId: string;
  name: string;
  crm: string;
  rqe: string;
  city: string;
  specialty: string;
  sources: StudioSourceInput[];
  pendencies?: string[];
  nivel?: "A" | "B";
  graduationInstitution?: string;
  graduationVerified?: boolean;
  residencyVerified?: boolean;
  currentInstitutions?: Array<{ name: string; role: string }>;
  collectedBy?: string;
  collectedAt?: string;
  crmStatus?: CrmStatus;
  hasIdentityConflict?: boolean;
  duplicateCrm?: boolean;
};

function inferCrmStatus(candidate: StudioCandidateInput): CrmStatus {
  if (candidate.crmStatus) {
    return candidate.crmStatus;
  }

  if (!candidate.crm.trim()) {
    return "unknown";
  }

  return "active";
}

function inferTeot(sources: StudioSourceInput[]): string | undefined {
  const match = sources.find((source) => TEOT_PATTERN.test(source.name));
  return match?.name.match(TEOT_PATTERN)?.[0];
}

export function mapStudioSourcesToEvidence(sources: StudioSourceInput[]): Evidence[] {
  return sources.map((source) =>
    enrichEvidence({
      id: source.id,
      name: source.name,
      type: source.type,
      url: source.url,
      consultedAt: source.consultedAt,
      responsible: source.responsible,
    }),
  );
}

export function mapStudioCandidateToDoctorCandidate(
  candidate: StudioCandidateInput,
): DoctorCandidate {
  const hasRqeInSources = candidate.sources.some((source) => RQE_PATTERN.test(source.name));
  const hasCrmInSources = candidate.sources.some((source) => CRM_PATTERN.test(source.name));

  return {
    id: candidate.id,
    caseId: candidate.caseId,
    name: candidate.name,
    crm: candidate.crm || (hasCrmInSources ? "presente-nas-fontes" : ""),
    crmStatus: inferCrmStatus(candidate),
    rqe: candidate.rqe || (hasRqeInSources ? "presente-nas-fontes" : undefined),
    teot: inferTeot(candidate.sources),
    specialty: candidate.specialty,
    city: candidate.city,
    state: "ES",
    graduation: candidate.graduationInstitution
      ? {
          institution: candidate.graduationInstitution,
          verified: candidate.graduationVerified ?? false,
        }
      : undefined,
    residency: candidate.residencyVerified
      ? [{ institution: "confirmada", program: candidate.specialty, verified: true }]
      : [],
    currentInstitutions: candidate.currentInstitutions,
    practiceAreas: candidate.specialty ? [candidate.specialty] : [],
    collectedBy: candidate.collectedBy ?? "Operador AliCIA",
    collectedAt: candidate.collectedAt ?? new Date().toISOString(),
    hasIdentityConflict: candidate.hasIdentityConflict ?? false,
    duplicateCrm: candidate.duplicateCrm ?? false,
  };
}

export function evaluateStudioCandidate(
  candidate: StudioCandidateInput,
): PublicationDecision {
  const doctorCandidate = mapStudioCandidateToDoctorCandidate(candidate);
  const evidence = mapStudioSourcesToEvidence(candidate.sources);
  return evaluateCandidate(doctorCandidate, evidence, { recordAudit: true });
}

export function createReviewCase(
  candidate: StudioCandidateInput,
  decision: PublicationDecision,
  createdAt: string = new Date().toISOString(),
): ReviewCase {
  return {
    candidateId: candidate.id,
    caseId: candidate.caseId,
    candidateName: candidate.name,
    decision,
    summary: decision.justification,
    createdAt,
  };
}

export function collectReviewCases(candidates: StudioCandidateInput[]): ReviewCase[] {
  return candidates
    .map((candidate) => {
      const decision = evaluateStudioCandidate(candidate);
      if (decision.outcome === "AUTO_PUBLISH") {
        return null;
      }

      return createReviewCase(candidate, decision);
    })
    .filter((reviewCase): reviewCase is ReviewCase => reviewCase !== null);
}

export function isAutoPublishCandidate(candidate: StudioCandidateInput): boolean {
  return evaluateStudioCandidate(candidate).outcome === "AUTO_PUBLISH";
}

export function getSuggestedOperationalLevel(
  candidate: StudioCandidateInput,
): "A" | "B" | undefined {
  const decision = evaluateStudioCandidate(candidate);

  if (decision.outcome === "REJECT") {
    return undefined;
  }

  return decision.suggestedNivel === "C" ? "B" : decision.suggestedNivel;
}
