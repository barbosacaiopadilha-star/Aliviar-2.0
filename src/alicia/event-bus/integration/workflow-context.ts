import type { DiscoveryCandidate } from "@/alicia/discovery";
import type { DoctorCandidate, Evidence } from "@/alicia/protocol-engine";

const discoveredCandidates = new Map<string, DiscoveryCandidate>();
const evidenceByCandidate = new Map<string, Evidence[]>();

export function registerDiscoveredCandidate(candidate: DiscoveryCandidate): void {
  discoveredCandidates.set(candidate.candidateId, candidate);
}

export function getDiscoveredCandidate(candidateId: string): DiscoveryCandidate | undefined {
  return discoveredCandidates.get(candidateId);
}

export function setCandidateEvidence(candidateId: string, evidence: Evidence[]): void {
  evidenceByCandidate.set(candidateId, evidence);
}

export function getCandidateEvidence(candidateId: string): Evidence[] {
  return evidenceByCandidate.get(candidateId) ?? [];
}

export function mapDiscoveryToDoctorCandidate(
  candidate: DiscoveryCandidate,
): DoctorCandidate {
  return {
    id: candidate.candidateId,
    caseId: `ALC-${candidate.crmUf}-2026-${candidate.candidateId.slice(-5)}`,
    name: candidate.nome,
    crm: candidate.crm ? `CRM-${candidate.crmUf} ${candidate.crm}` : "",
    crmStatus: candidate.crm ? "active" : "unknown",
    specialty: candidate.especialidade,
    city: candidate.cidade,
    state: candidate.estado,
    graduation: undefined,
    residency: [],
    currentInstitutions: candidate.urlOrigem
      ? [{ name: candidate.urlOrigem, role: candidate.especialidade }]
      : [],
    practiceAreas: [candidate.especialidade],
    collectedBy: "Discovery Engine",
    collectedAt: candidate.dataDescoberta,
    hasIdentityConflict: false,
    duplicateCrm: false,
  };
}

export function resetWorkflowContext(): void {
  discoveredCandidates.clear();
  evidenceByCandidate.clear();
}
