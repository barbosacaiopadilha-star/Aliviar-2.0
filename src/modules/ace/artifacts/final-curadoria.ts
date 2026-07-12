// FinalCuradoria — artefato de saída do P010 (Final Curadoria Delivery).
// Ver docs/ace/04-specs/P010-final-curadoria-delivery/specification.md,
// seção "Estrutura mínima da Final Curadoria".
//
// Estende DeliveryArtifact (core/artifact-contract.ts): materializa e
// comunica uma decisão humana já registrada no P009 — nunca toma uma
// nova decisão, nunca substitui, adiciona ou remove um provider aprovado.
// `decisional` é sempre `false`: a decisão já ocorreu no HumanReviewResult
// referenciado; o P010 apenas a apresenta.
//
// A ordem de `providerPresentations` é sempre neutra e determinística
// (por providerId) — nunca representa preferência, prioridade ou
// recomendação superior, mesma convenção do EligibleProviderSet/Shortlist.

import { randomUUID } from "node:crypto";

import type { DeliveryArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { deepFreeze } from "@/modules/ace/core/deep-freeze";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";

export type ProviderPresentation = {
  providerId: string;
  displayName: string;
  professionalSummary: string;
  whyIncluded: string;
  strengthsForThisCase: string[];
  relevantLimitations: string[];
  practicalConsiderations: string[];
};

export type FinalCuradoria = DeliveryArtifact & {
  caseReference: ArtifactReference<"DecisionCase">;
  generatedAt: string;
  decisionSummary: string;
  clientContextSummary: string;
  providerPresentations: ProviderPresentation[];
  comparisonSummary: string;
  relevantLimitations: string[];
  relevantMissingInformation: string[];
  nextSteps: string[];
  methodExplanation: string;
  disclaimer: string;
};

export type CreateFinalCuradoriaInput = {
  validatedBy: string;
  validatedAt: string;
  humanReviewReference: DeliveryArtifact["humanReviewReference"];
  caseReference: ArtifactReference<"DecisionCase">;
  generatedAt: string;
  decisionSummary: string;
  clientContextSummary: string;
  providerPresentations: ProviderPresentation[];
  comparisonSummary: string;
  relevantLimitations: string[];
  relevantMissingInformation: string[];
  nextSteps: string[];
  methodExplanation: string;
  disclaimer: string;
  methodVersion: string;
};

const REQUIRED_PROVIDER_COUNT = 3;

// Vocabulário de ranking/vencedor que a Final Curadoria nunca pode
// conter, mecanicamente verificável — mesmo quando o texto é fornecido
// já pronto (Sprint 11: "não utilizar primeiro lugar, segunda opção,
// terceira opção, melhor, mais recomendado, vencedor, nota, percentual,
// ranking"). Deliberadamente NÃO inclui termos clínicos ("diagnóstico",
// "tratamento") — o disclaimer obrigatório desta mesma Final Curadoria
// precisa mencioná-los para dizer que a curadoria NÃO os substitui,
// então bani-los mecanicamente entraria em conflito com o próprio
// conteúdo exigido. A ausência de uma CLAIM diagnóstica (em vez da mera
// menção à palavra) permanece responsabilidade do processo
// humano/editorial, não mecanicamente verificável.
const FORBIDDEN_PHRASES = [
  "primeiro lugar",
  "segundo lugar",
  "terceiro lugar",
  "primeira opção",
  "segunda opção",
  "terceira opção",
  "melhor opção",
  "mais recomendado",
  "mais indicado",
  "vencedor",
  "vencedora",
  "ranking",
  "nota:",
];

function isSortedByProviderId(ids: string[]): boolean {
  return ids.every((id, index) => index === 0 || ids[index - 1].localeCompare(id) <= 0);
}

function collectFreeText(input: CreateFinalCuradoriaInput): string[] {
  const texts = [
    input.decisionSummary,
    input.clientContextSummary,
    input.comparisonSummary,
    input.methodExplanation,
    input.disclaimer,
    ...input.nextSteps,
  ];

  for (const presentation of input.providerPresentations) {
    texts.push(
      presentation.displayName,
      presentation.professionalSummary,
      presentation.whyIncluded,
      ...presentation.strengthsForThisCase,
      ...presentation.relevantLimitations,
      ...presentation.practicalConsiderations,
    );
  }

  return texts;
}

function assertNoForbiddenLanguage(input: CreateFinalCuradoriaInput, protocolId: "P010"): void {
  const allText = collectFreeText(input).join(" \n ").toLowerCase();

  if (allText.includes("%")) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "FinalCuradoria não pode conter percentual (\"%\") em nenhum texto — nunca score, nunca ranking.",
    });
  }

  for (const phrase of FORBIDDEN_PHRASES) {
    if (allText.includes(phrase)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `FinalCuradoria não pode conter a expressão "${phrase}" em nenhum texto — nunca ranking, nota, vencedor ou conteúdo clínico.`,
      });
    }
  }
}

function assertRequiredFields(input: CreateFinalCuradoriaInput, protocolId: "P010"): void {
  const requiredNonEmpty: Array<[string, string]> = [
    ["validatedBy", input.validatedBy],
    ["validatedAt", input.validatedAt],
    ["generatedAt", input.generatedAt],
    ["decisionSummary", input.decisionSummary],
    ["clientContextSummary", input.clientContextSummary],
    ["comparisonSummary", input.comparisonSummary],
    ["methodExplanation", input.methodExplanation],
    ["disclaimer", input.disclaimer],
  ];

  for (const [field, value] of requiredNonEmpty) {
    if (!value) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `FinalCuradoria requer ${field} não vazio.`,
      });
    }
  }

  if (!input.humanReviewReference || !input.caseReference) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "FinalCuradoria requer humanReviewReference e caseReference.",
    });
  }

  if (input.nextSteps.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "FinalCuradoria requer ao menos um item em nextSteps.",
    });
  }
}

function assertProviderPresentationsInvariants(input: CreateFinalCuradoriaInput, protocolId: "P010"): void {
  if (input.providerPresentations.length !== REQUIRED_PROVIDER_COUNT) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `FinalCuradoria deve conter exatamente ${REQUIRED_PROVIDER_COUNT} providerPresentations — recebido ${input.providerPresentations.length}.`,
    });
  }

  const ids = input.providerPresentations.map((p) => p.providerId);

  if (new Set(ids).size !== ids.length) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "providerPresentations não pode conter providers duplicados.",
    });
  }

  if (!isSortedByProviderId(ids)) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "providerPresentations deve estar em ordem neutra e determinística (por providerId) — a posição nunca representa preferência, prioridade ou recomendação superior.",
    });
  }

  for (const presentation of input.providerPresentations) {
    if (!presentation.displayName || !presentation.professionalSummary || !presentation.whyIncluded) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `A apresentação do provider "${presentation.providerId}" requer displayName, professionalSummary e whyIncluded não vazios.`,
      });
    }
  }
}

export function createFinalCuradoria(input: CreateFinalCuradoriaInput): FinalCuradoria {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P010", "FinalCuradoria");
  assertRequiredFields(input, "P010");
  assertProviderPresentationsInvariants(input, "P010");
  assertNoForbiddenLanguage(input, "P010");

  return deepFreeze({
    id: randomUUID(),
    version: 1,
    createdAt: input.generatedAt,
    producedBy: "P010",
    decisional: false,
    ...input,
  }) as FinalCuradoria;
}
