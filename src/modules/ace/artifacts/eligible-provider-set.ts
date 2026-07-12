// EligibleProviderSet — artefato de saída do P006 (Eligible Provider Set
// Builder). Ver
// docs/ace/04-specs/P006-eligible-provider-set-builder/specification.md,
// seção "Saída".
//
// Representa semanticamente um CONJUNTO, nunca uma lista ordenada. Onde a
// serialização exige array (`eligibleProviderIds`), a ordem é estável por
// providerId exclusivamente para determinismo e reprodutibilidade — nunca
// representa relevância, preferência ou ranking. Nenhum consumidor futuro
// pode interpretar a posição como sinal decisório.
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";

export type EligibilityEvaluation = {
  providerId: string;
  eligible: boolean;
  reason: string;
};

export type EligibleProviderSetSourceType = "CompetencyProfile";

export type EligibleProviderSetSourceReference = ArtifactReference<EligibleProviderSetSourceType>;

export type EligibleProviderSet = AnalysisArtifact & {
  // Ordenado por providerId — apenas para determinismo/reprodutibilidade,
  // nunca ranking. Ver nota no topo do arquivo.
  eligibleProviderIds: string[];
  evaluatedCandidates: EligibilityEvaluation[];
  sourceArtifacts: EligibleProviderSetSourceReference[];
  methodVersion: string;
};

export type CreateEligibleProviderSetInput = {
  eligibleProviderIds: string[];
  evaluatedCandidates: EligibilityEvaluation[];
  sourceArtifacts: EligibleProviderSetSourceReference[];
  methodVersion: string;
};

function isSortedByProviderId(ids: string[]): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1].localeCompare(id) <= 0);
}

function assertStableOrder(input: CreateEligibleProviderSetInput, protocolId: "P006"): void {
  if (!isSortedByProviderId(input.eligibleProviderIds)) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message:
        "eligibleProviderIds deve estar ordenado por providerId (ordem estável, sem significado de ranking).",
    });
  }
}

function assertEligibleIdsConsistency(
  input: CreateEligibleProviderSetInput,
  protocolId: "P006",
): void {
  const trulyEligible = new Set(
    input.evaluatedCandidates.filter((evaluation) => evaluation.eligible).map((e) => e.providerId),
  );
  const declaredEligible = new Set(input.eligibleProviderIds);

  const matches =
    trulyEligible.size === declaredEligible.size &&
    [...trulyEligible].every((id) => declaredEligible.has(id));

  if (!matches) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message:
        "eligibleProviderIds deve corresponder exatamente aos candidatos marcados como elegíveis em evaluatedCandidates.",
    });
  }
}

function assertRequiredFields(input: CreateEligibleProviderSetInput, protocolId: "P006"): void {
  if (!input.sourceArtifacts || input.sourceArtifacts.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "EligibleProviderSet requer ao menos uma referência em sourceArtifacts.",
    });
  }

  for (const evaluation of input.evaluatedCandidates) {
    if (!evaluation.reason) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `A avaliação do provider "${evaluation.providerId}" requer uma justificativa (reason).`,
      });
    }
  }
}

export function createEligibleProviderSet(
  input: CreateEligibleProviderSetInput,
): EligibleProviderSet {
  assertFieldPolicy(
    input as unknown as Record<string, unknown>,
    "P006",
    "EligibleProviderSet",
  );
  assertRequiredFields(input, "P006");
  assertEligibleIdsConsistency(input, "P006");
  assertStableOrder(input, "P006");

  return createInitialVersion({
    ...input,
    decisional: false,
    producedBy: "P006",
  }) as EligibleProviderSet;
}
