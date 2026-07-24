import { evaluateEligibility } from "./eligibility-engine";
import { executeRules, FORMATION_RULES, PUBLICATION_RULES, partitionRuleResults } from "./rules";
import type {
  DoctorCandidate,
  EligibilityResult,
  Evidence,
  EvidenceReport,
  PublicationDecision,
  PublicationOutcome,
} from "./types";

const REVIEW_BLOCKING_ELIGIBILITY = new Set([
  "ELIG-002",
  "ELIG-003",
  "ELIG-007",
  "ELIG-010",
  "ELIG-012",
]);

const REVIEW_BLOCKING_FORMATION = new Set(["FORM-002"]);

function determinePublicationOutcome(
  eligibility: EligibilityResult,
  publicationPartition: ReturnType<typeof partitionRuleResults>,
  formationPartition: ReturnType<typeof partitionRuleResults>,
): PublicationOutcome {
  const rejectByEligibility = eligibility.outcome === "not_eligible";
  const rejectRules = eligibility.failedRules.some((rule) =>
    ["ELIG-004", "ELIG-011", "ELIG-013"].includes(rule.id),
  );

  if (rejectByEligibility || rejectRules) {
    return "REJECT";
  }

  const blockingEligibilityReview = eligibility.pendingRules.some((rule) =>
    REVIEW_BLOCKING_ELIGIBILITY.has(rule.id),
  );
  const blockingFormationReview = formationPartition.pending.some((rule) =>
    REVIEW_BLOCKING_FORMATION.has(rule.id),
  );
  const needsFourEyes = publicationPartition.pending.some((rule) => rule.id === "PUB-003");
  const hasCriticalConflict = publicationPartition.pending.some((rule) => rule.id === "PUB-002");
  const insufficientSources = publicationPartition.pending.some((rule) => rule.id === "PUB-001");

  const needsHumanReview =
    eligibility.outcome === "review_required" ||
    blockingEligibilityReview ||
    blockingFormationReview ||
    needsFourEyes ||
    hasCriticalConflict ||
    insufficientSources;

  if (needsHumanReview) {
    return "HUMAN_REVIEW";
  }

  if (eligibility.outcome === "eligible" && eligibility.nivel === "B") {
    return "AUTO_PUBLISH";
  }

  return "HUMAN_REVIEW";
}

function buildPublicationJustification(
  outcome: PublicationOutcome,
  eligibility: EligibilityResult,
  publicationPartition: ReturnType<typeof partitionRuleResults>,
): string {
  if (outcome === "REJECT") {
    const reasons = [
      ...eligibility.failedRules.map((rule) => rule.message),
      ...publicationPartition.failed.map((rule) => rule.message),
    ];
    return `Rejeitado pelo Protocol Engine: ${reasons.join(" ")}`;
  }

  if (outcome === "AUTO_PUBLISH") {
    return `Publicação automática autorizada em Nível ${eligibility.nivel}. Todas as regras obrigatórias satisfeitas.`;
  }

  const pending = [
    ...eligibility.pendingRules,
    ...publicationPartition.pending,
  ].map((rule) => rule.message);

  return `Revisão humana obrigatória: ${pending.join(" ")}`;
}

/**
 * Decisão final de publicação — somente AUTO_PUBLISH, HUMAN_REVIEW ou REJECT.
 */
export function decidePublication(
  candidate: DoctorCandidate,
  evidence: Evidence[],
  evidenceReport: EvidenceReport,
): PublicationDecision {
  const eligibility = evaluateEligibility(candidate, evidence, evidenceReport);
  const context = { candidate, evidence, evidenceReport };
  const publicationResults = executeRules(PUBLICATION_RULES, context);
  const formationResults = executeRules(FORMATION_RULES, context);
  const publicationPartition = partitionRuleResults(publicationResults);
  const formationPartition = partitionRuleResults(formationResults);

  const allRules = [
    ...eligibility.satisfiedRules,
    ...eligibility.failedRules,
    ...eligibility.pendingRules,
    ...publicationPartition.satisfied,
    ...publicationPartition.failed,
    ...publicationPartition.pending,
  ];

  const satisfiedRules = allRules.filter((rule) => rule.status === "satisfied");
  const failedRules = allRules.filter((rule) => rule.status === "failed");
  const pendingRules = allRules.filter((rule) => rule.status === "pending");

  const outcome = determinePublicationOutcome(
    eligibility,
    publicationPartition,
    formationPartition,
  );

  return {
    outcome,
    eligibility,
    evidenceReport,
    satisfiedRules,
    failedRules,
    pendingRules,
    suggestedNivel: eligibility.nivel === "C" ? "B" : eligibility.nivel,
    justification: buildPublicationJustification(outcome, eligibility, publicationPartition),
  };
}
