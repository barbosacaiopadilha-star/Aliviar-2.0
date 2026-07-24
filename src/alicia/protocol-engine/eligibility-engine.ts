import {
  ALL_PROTOCOL_RULES,
  ELIGIBILITY_RULES,
  FORMATION_RULES,
  executeRules,
  partitionRuleResults,
} from "./rules";
import type {
  DoctorCandidate,
  EligibilityOutcome,
  EligibilityResult,
  Evidence,
  EvidenceReport,
  OperationalLevel,
} from "./types";

function determineNivel(
  candidate: DoctorCandidate,
  evidenceReport: EvidenceReport,
  formationPartition: ReturnType<typeof partitionRuleResults>,
): OperationalLevel {
  const eligibilityFailed =
    candidate.crmStatus === "suspended" ||
    candidate.crmStatus === "cancelled" ||
    candidate.crmStatus === "deceased" ||
    evidenceReport.onlyLowTrustSources ||
    (candidate.crm.trim().length === 0 && evidenceReport.level1to3Count === 0);

  if (eligibilityFailed) {
    return "C";
  }

  const nivelAReady =
    formationPartition.satisfied.length === FORMATION_RULES.length &&
    formationPartition.pending.length === 0 &&
    formationPartition.failed.length === 0;

  if (nivelAReady) {
    return "A";
  }

  const hasMinimumTrust =
    evidenceReport.level1to3Count >= 1 && evidenceReport.totalSources >= 1;

  if (
    hasMinimumTrust &&
    (candidate.crmStatus === "active" || candidate.crmStatus === "unknown")
  ) {
    return "B";
  }

  return "C";
}

function determineOutcome(
  failed: ReturnType<typeof partitionRuleResults>["failed"],
  pending: ReturnType<typeof partitionRuleResults>["pending"],
): EligibilityOutcome {
  const hardReject = failed.some((rule) =>
    ["ELIG-004", "ELIG-003", "ELIG-011", "ELIG-013", "ELIG-008", "ELIG-009"].includes(rule.id),
  );

  if (hardReject) {
    return "not_eligible";
  }

  if (failed.length > 0 || pending.length > 0) {
    return "review_required";
  }

  return "eligible";
}

function buildJustification(
  outcome: EligibilityOutcome,
  nivel: OperationalLevel,
  failed: ReturnType<typeof partitionRuleResults>["failed"],
  pending: ReturnType<typeof partitionRuleResults>["pending"],
): string {
  if (outcome === "not_eligible") {
    return `Não elegível (Nível ${nivel}): ${failed.map((rule) => rule.message).join(" ")}`;
  }

  if (outcome === "review_required") {
    const reasons = [...pending, ...failed].map((rule) => rule.message);
    return `Revisão humana necessária (Nível ${nivel}): ${reasons.join(" ")}`;
  }

  return `Elegível para publicação em Nível ${nivel} conforme Protocolo 1.0.`;
}

/**
 * Determina elegibilidade com base exclusivamente nas regras do Protocolo.
 */
export function evaluateEligibility(
  candidate: DoctorCandidate,
  evidence: Evidence[],
  evidenceReport: EvidenceReport,
): EligibilityResult {
  const context = { candidate, evidence, evidenceReport };

  const eligibilityResults = executeRules(ELIGIBILITY_RULES, context);
  const formationResults = executeRules(FORMATION_RULES, context);

  const eligibilityPartition = partitionRuleResults(eligibilityResults);
  const formationPartition = partitionRuleResults(formationResults);

  const nivel = determineNivel(candidate, evidenceReport, formationPartition);
  const outcome = determineOutcome(eligibilityPartition.failed, eligibilityPartition.pending);

  return {
    outcome,
    nivel,
    satisfiedRules: [...eligibilityPartition.satisfied, ...formationPartition.satisfied],
    failedRules: [...eligibilityPartition.failed, ...formationPartition.failed],
    pendingRules: [...eligibilityPartition.pending, ...formationPartition.pending],
    justification: buildJustification(
      outcome,
      nivel,
      [...eligibilityPartition.failed, ...formationPartition.failed],
      [...eligibilityPartition.pending, ...formationPartition.pending],
    ),
  };
}

export function evaluateAllRules(
  candidate: DoctorCandidate,
  evidence: Evidence[],
  evidenceReport: EvidenceReport,
) {
  const context = { candidate, evidence, evidenceReport };
  return partitionRuleResults(executeRules(ALL_PROTOCOL_RULES, context));
}
