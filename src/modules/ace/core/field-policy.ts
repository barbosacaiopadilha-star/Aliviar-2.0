// Política de campos em três camadas (ADR-014, docs/DECISIONS.md).
// Substitui a antiga lista universal de campos proibidos, que não
// conseguia expressar "compatibility é proibido antes do P007, mas
// legítimo a partir dele".
//
// 1. KERNEL_FORBIDDEN_FIELDS — proibido em qualquer artefato, sempre,
//    permanentemente. Nenhum estágio futuro os libera.
// 2. STAGE_RESERVED_FIELDS — legítimo somente a partir de um estágio do
//    pipeline específico; proibido em qualquer artefato produzido antes
//    dele.
// 3. assertFieldPolicy — aplica as duas camadas acima a um artefato,
//    dado o protocolo que o produziu.

import { ProtocolError } from "./error-contract";
import { stageOrder, type PipelineStageId } from "./pipeline-stage";
import type { ProtocolId } from "./protocol-id";

export const KERNEL_FORBIDDEN_FIELDS = [
  // Clínico — nunca produzido por nenhum protocolo do ACE (Constituição,
  // seção 3; Kernel, seção 1).
  "diagnosis",
  "diagnostico",
  "diagnosisHypothesis",
  "treatment",
  "prescription",
  "medicationRecommendation",
  "medicalAdvice",
  "specialty",
  "especialidade",
  "inferredSpecialty",
  "confidence",
  "confidenceLevel",
  "competencies",
  // Vocabulário descartado (ADR-013) — nunca "Specialist", sempre "Care
  // Provider". Permanentemente banido, não apenas até um estágio.
  "specialists",
  "eligibleSpecialists",
  // Decisório — reservado exclusivamente ao par Curadoria
  // Validada/Curadoria Final (P009/P010), que não são Artefatos de
  // Análise e não passam por esta validação (Constituição, Princípio 9).
  "selectedProvider",
  "finalDecision",
  // Comercial — independência da curadoria nunca é negociável
  // (Constituição, Princípio 2).
  "commercialRanking",
  "paidPlacement",
] as const;

export const STAGE_RESERVED_FIELDS: Record<string, PipelineStageId> = {
  competencyProfile: "P005",
  eligibleProviderSet: "P006",
  eligibleProviderIds: "P006",
  evaluatedCandidates: "P006",
  compatibility: "P007",
  compatibilityMatrix: "P007",
  competencyAlignment: "P007",
  experienceAlignment: "P007",
  contextAlignment: "P007",
  strategyAlignment: "P007",
  constraintAlignment: "P007",
  continuityAlignment: "P007",
  strengths: "P007",
  limitations: "P007",
  shortlist: "P008",
  selectedProviderIds: "P008",
  candidateProviderIds: "P008",
  providerRationales: "P008",
  compositionRationale: "P008",
  relevantLimitations: "P008",
  blockedReason: "P008",
  reviewStatus: "P009",
  reviewAction: "P009",
  approvedProviderIds: "P009",
  reviewRationale: "P009",
  originalShortlistReference: "P009",
  compatibilityMatrixReference: "P009",
  returnToProtocol: "P009",
  validationDecision: "P009",
  finalCuradoria: "P010",
  caseReference: "P010",
  decisionSummary: "P010",
  clientContextSummary: "P010",
  providerPresentations: "P010",
  comparisonSummary: "P010",
  methodExplanation: "P010",
  disclaimer: "P010",
};

function collectKeys(candidate: unknown, found: Set<string>): void {
  if (candidate === null || typeof candidate !== "object") {
    return;
  }

  for (const key of Object.keys(candidate as Record<string, unknown>)) {
    found.add(key);
    collectKeys((candidate as Record<string, unknown>)[key], found);
  }
}

export function findKernelViolations(candidate: Record<string, unknown>): string[] {
  const keys = new Set<string>();
  collectKeys(candidate, keys);

  return [...keys].filter((key) => (KERNEL_FORBIDDEN_FIELDS as readonly string[]).includes(key));
}

export function findStageViolations(
  candidate: Record<string, unknown>,
  producedBy: PipelineStageId,
): string[] {
  const keys = new Set<string>();
  collectKeys(candidate, keys);

  const producedByOrder = stageOrder(producedBy);

  return [...keys].filter((key) => {
    const availableFrom = STAGE_RESERVED_FIELDS[key];
    return availableFrom !== undefined && stageOrder(availableFrom) > producedByOrder;
  });
}

export function assertFieldPolicy(
  candidate: Record<string, unknown>,
  producedBy: ProtocolId,
  artifactName: string,
): void {
  const kernelViolations = findKernelViolations(candidate);
  if (kernelViolations.length > 0) {
    throw new ProtocolError({
      code: "FORBIDDEN_FIELD_PRESENT",
      protocolId: producedBy,
      message: `${artifactName} não pode conter os campos (proibição permanente do Kernel): ${kernelViolations.join(", ")}`,
    });
  }

  const stageViolations = findStageViolations(candidate, producedBy);
  if (stageViolations.length > 0) {
    throw new ProtocolError({
      code: "FORBIDDEN_FIELD_PRESENT",
      protocolId: producedBy,
      message: `${artifactName} (produzido por ${producedBy}) antecipa campos reservados a uma etapa posterior do pipeline: ${stageViolations.join(", ")}`,
    });
  }
}
