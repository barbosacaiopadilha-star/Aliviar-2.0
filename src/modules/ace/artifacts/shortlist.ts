// Shortlist — artefato de saída do P008 (Shortlist Builder). Ver
// docs/ace/04-specs/P008-shortlist-builder/specification.md, seção "Saída".
//
// `selectedProviderIds`/`candidateProviderIds` nunca representam ranking,
// mesmo serializados como array: a ordem é sempre neutra e determinística
// (por providerId) — mesma convenção já usada por EligibleProviderSet
// (P006). A ordenação por providerId serve apenas para serialização
// neutra; ela nunca decide quais providers entram na Shortlist (Sprint
// 10, correção obrigatória).
//
// Quando não há três candidatos suficientemente fundamentados, ou quando
// há mais de três e a CompatibilityMatrix não contém critério legítimo
// para reduzir esse conjunto sem arbitrariedade, `status` é `BLOCKED` —
// o Método nunca desempata por um critério que equivalha a um ranking
// disfarçado (ex.: ordem alfabética), e nunca reduz o padrão de qualidade
// apenas para completar três nomes. `blockedReason` distingue as três
// causas possíveis: opções insuficientes, evidências insuficientes, ou
// composição ambígua (mais de três igualmente fundamentados).
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada. Só uma validação humana (P009,
// ainda não especificado) pode transformar esta proposta em Curadoria
// Validada — o P008 nunca inicia o P009 automaticamente.

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";

export type ShortlistStatus = "COMPOSED" | "BLOCKED";

// INSUFFICIENT_OPTIONS: a CompatibilityMatrix tem menos de três Care
// Providers avaliados no total — o problema é a falta de candidatos.
// INSUFFICIENT_EVIDENCE: há três ou mais avaliados, mas menos de três
// atendem aos requisitos essenciais — o problema é a falta de
// fundamentação suficiente, não a falta de candidatos.
// AMBIGUOUS_COMPOSITION: há mais de três candidatos igualmente
// fundamentados, e nenhum critério legítimo (presente na
// CompatibilityMatrix) permite reduzir esse conjunto a três sem
// arbitrariedade — resolver isso é uma decisão humana (P009), nunca um
// desempate mecânico.
export type ShortlistBlockedReason = "INSUFFICIENT_OPTIONS" | "INSUFFICIENT_EVIDENCE" | "AMBIGUOUS_COMPOSITION";

export type ProviderRationale = {
  providerId: string;
  rationale: string;
};

export type ShortlistSourceType = "CompatibilityMatrix";

export type ShortlistSourceReference = ArtifactReference<ShortlistSourceType>;

export type Shortlist = AnalysisArtifact & {
  status: ShortlistStatus;
  // Presente (não null) se e somente se status === "BLOCKED".
  blockedReason: ShortlistBlockedReason | null;
  // Exatamente 3 quando COMPOSED; vazio quando BLOCKED. Ordem neutra por
  // providerId — nunca ranking.
  selectedProviderIds: string[];
  // Preserva todos os candidatos aptos (qualificados) quando BLOCKED, para
  // que a revisão humana (P009) não precise recomeçar a análise do zero.
  // Vazio quando COMPOSED (redundante com selectedProviderIds nesse caso).
  candidateProviderIds: string[];
  // Uma justificativa por provider em selectedProviderIds (COMPOSED) ou
  // em candidateProviderIds (BLOCKED).
  providerRationales: ProviderRationale[];
  compositionRationale: string;
  relevantLimitations: string[];
  missingInformation: string[];
  sourceArtifact: ShortlistSourceReference;
  methodVersion: string;
};

export type CreateShortlistInput = {
  status: ShortlistStatus;
  blockedReason: ShortlistBlockedReason | null;
  selectedProviderIds: string[];
  candidateProviderIds: string[];
  providerRationales: ProviderRationale[];
  compositionRationale: string;
  relevantLimitations: string[];
  missingInformation: string[];
  sourceArtifact: ShortlistSourceReference;
  methodVersion: string;
};

const REQUIRED_COMPOSED_SIZE = 3;

function isSortedByProviderId(ids: string[]): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1].localeCompare(id) <= 0);
}

function assertNoDuplicates(ids: string[], protocolId: "P008", fieldName: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `${fieldName} não pode conter providers duplicados.`,
    });
  }
}

function assertHasRationaleForEach(
  providerIds: string[],
  providerRationales: ProviderRationale[],
  protocolId: "P008",
  fieldName: string,
): void {
  for (const providerId of providerIds) {
    const hasRationale = providerRationales.some((entry) => entry.providerId === providerId && entry.rationale);
    if (!hasRationale) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `O provider "${providerId}" presente em ${fieldName} requer uma justificativa individual não vazia em providerRationales.`,
      });
    }
  }

  if (providerRationales.length !== providerIds.length) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `providerRationales deve conter exatamente uma justificativa por provider em ${fieldName} — nem mais, nem menos.`,
    });
  }
}

function assertRequiredFields(input: CreateShortlistInput, protocolId: "P008"): void {
  if (!input.compositionRationale) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "Shortlist requer compositionRationale (justificativa da composição ou do bloqueio).",
    });
  }

  if (!input.sourceArtifact) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "Shortlist requer sourceArtifact (referência à CompatibilityMatrix de origem).",
    });
  }
}

function assertComposedInvariants(input: CreateShortlistInput, protocolId: "P008"): void {
  if (input.status === "BLOCKED") {
    if (input.blockedReason === null) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: "Uma Shortlist BLOCKED requer blockedReason (INSUFFICIENT_OPTIONS, INSUFFICIENT_EVIDENCE ou AMBIGUOUS_COMPOSITION).",
      });
    }

    if (input.selectedProviderIds.length !== 0) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: "Uma Shortlist BLOCKED não pode conter providers em selectedProviderIds — nenhuma seleção foi feita.",
      });
    }

    assertNoDuplicates(input.candidateProviderIds, protocolId, "candidateProviderIds");

    if (!isSortedByProviderId(input.candidateProviderIds)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: "candidateProviderIds deve estar em ordem neutra e determinística (por providerId) — apenas para serialização, nunca para decidir a composição.",
      });
    }

    assertHasRationaleForEach(input.candidateProviderIds, input.providerRationales, protocolId, "candidateProviderIds");
    return;
  }

  // status === "COMPOSED"
  if (input.blockedReason !== null) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "Uma Shortlist COMPOSED não pode ter blockedReason.",
    });
  }

  if (input.candidateProviderIds.length !== 0) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "Uma Shortlist COMPOSED não usa candidateProviderIds — os providers já estão em selectedProviderIds.",
    });
  }

  if (input.selectedProviderIds.length !== REQUIRED_COMPOSED_SIZE) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `Uma Shortlist COMPOSED deve conter exatamente ${REQUIRED_COMPOSED_SIZE} providers — recebido ${input.selectedProviderIds.length}. Quando há mais de três candidatos igualmente fundamentados, o resultado correto é BLOCKED (AMBIGUOUS_COMPOSITION), nunca uma seleção arbitrária dos três primeiros.`,
    });
  }

  assertNoDuplicates(input.selectedProviderIds, protocolId, "selectedProviderIds");

  if (!isSortedByProviderId(input.selectedProviderIds)) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "selectedProviderIds deve estar em ordem neutra e determinística (por providerId) — a posição nunca representa preferência, prioridade, qualidade ou recomendação superior.",
    });
  }

  assertHasRationaleForEach(input.selectedProviderIds, input.providerRationales, protocolId, "selectedProviderIds");
}

export function createShortlist(input: CreateShortlistInput): Shortlist {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P008", "Shortlist");
  assertRequiredFields(input, "P008");
  assertComposedInvariants(input, "P008");

  return createInitialVersion({
    ...input,
    decisional: false,
    producedBy: "P008",
  }) as Shortlist;
}
