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
//
// "ranking" (GO LIVE, auditoria do Golden Set) NÃO entra nesta lista —
// diferente dos termos abaixo, ele é o único com uso legítimo e exigido
// pela própria specification.md do P010 ("comparisonSummary — explica
// que não há ranking entre os três"): negar a existência de ranking
// exige nomeá-lo. Banir a substring bare bloquearia exatamente a frase
// que o prompt.md pede ao modelo para escrever. Ver
// isPhraseOccurrenceNegated/hasUnnegatedOccurrenceOfPhrase abaixo — mesmo
// raciocínio já aplicado a "diagnóstico"/"tratamento" (não banidos por
// causa do disclaimer), agora generalizado para "ranking" (CAL-001) e
// "mais indicado" (CAL-004).
const ABSOLUTE_FORBIDDEN_PHRASES = [
  "primeiro lugar",
  "segundo lugar",
  "terceiro lugar",
  "primeira opção",
  "segunda opção",
  "terceira opção",
  "melhor opção",
  "melhor profissional",
  "mais recomendado",
  "vencedor",
  "vencedora",
  "score",
  "percentual",
  "nota:",
];

// CAL-001 (docs/ace/CALIBRATION_REPORT.md): uma lista fechada de verbos de
// negação ("não há", "não existe"...) nunca fecha essa classe de problema —
// o prompt.md do P010 incentiva deliberadamente frases humanas variadas
// ("não funciona como um ranking" é uma amostra real do modelo que uma
// lista de verbos não previu). A verificação abaixo troca "qual verbo
// específico nega?" por "existe QUALQUER gatilho de negação dentro da
// MESMA cláusula que esta expressão?" — pequena, determinística, auditável
// em funções isoladas (nunca uma regex monolítica cobrindo negação e
// ruptura de cláusula ao mesmo tempo).
//
// CAL-004: a mesma infraestrutura (cláusula local + gatilho de negação),
// antes exclusiva de "ranking", agora é parametrizada pela expressão-alvo
// — reutilizada por "mais indicado" (mesma classe de problema: o modelo
// nega legitimamente uma expressão da lista de vocabulário proibido, e uma
// checagem de substring simples não distingue negação de afirmação).
// "Ranking" continua se comportando exatamente como antes (mesmas funções,
// mesmo texto, só chamadas com o parâmetro "ranking" explícito) — nenhuma
// mudança de comportamento para o CAL-001, comprovada pelos testes
// existentes continuando a passar sem alteração.
//
// Gatilhos de negação: conjunto pequeno e fechado (não/nunca/sem/
// nenhum+flexões/jamais) — não um verbo específico.
const NEGATION_TRIGGER_PATTERN = /\bn[ãa]o\b|\bnunca\b|\bsem\b|\bnenhum\w*\b|\bjamais\b/;

// Qualquer um destes encerra a cláusula local — uma negação anterior a eles
// nunca "alcança" uma expressão proibida posterior. Pontuação forte sempre
// delimita; conjunções adversativas delimitam mesmo sem pontuação forte
// (mudança de oração real: "não sei se você reparou, MAS este é o
// primeiro no ranking" — a negação pertence à oração anterior, não a
// esta). Vírgula sozinha nunca delimita por si só — só quando efetivamente
// acompanha uma das conjunções acima, o que a própria conjunção já cobre.
function findClauseBoundaryPattern(): RegExp {
  return /[.?!\n;:]|\bmas\b|\bpor[ée]m\b|\bcontudo\b|\bentretanto\b|\btodavia\b|\bno entanto\b/g;
}

// Recorta o trecho de texto entre o limite de cláusula mais próximo (antes
// de `index`) e `index` — a "cláusula local" de uma ocorrência da expressão
// avaliada.
function extractLocalClauseBefore(text: string, index: number): string {
  const preceding = text.slice(0, index);
  const boundaryPattern = findClauseBoundaryPattern();

  let clauseStart = 0;
  let boundaryMatch: RegExpExecArray | null;
  while ((boundaryMatch = boundaryPattern.exec(preceding)) !== null) {
    clauseStart = boundaryMatch.index + boundaryMatch[0].length;
  }

  return preceding.slice(clauseStart);
}

// Escapa caracteres especiais de regex antes de montar o padrão de
// ocorrência — `phrase` hoje só recebe literais fixos ("ranking", "mais
// indicado"), nenhum dos dois contém metacaractere, mas a função existe
// para que a parametrização nunca dependa desse acaso.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Índices de todas as ocorrências da expressão-alvo no texto — cada uma é
// avaliada de forma independente (uma pode estar negada, outra não).
// `phrase` pode ser uma palavra única ("ranking") ou uma expressão de
// várias palavras ("mais indicado") — o espaço interno já casa
// literalmente com o texto (sempre já normalizado para minúsculas antes
// de chegar aqui).
function findPhraseOccurrenceIndices(text: string, phrase: string): number[] {
  const indices: number[] = [];
  const pattern = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "g");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    indices.push(match.index);
  }
  return indices;
}

function isPhraseOccurrenceNegated(text: string, phraseIndex: number): boolean {
  const localClause = extractLocalClauseBefore(text, phraseIndex);
  return NEGATION_TRIGGER_PATTERN.test(localClause);
}

// Nota: não duplica aqui a checagem de expressões absolutas proibidas
// (ABSOLUTE_FORBIDDEN_PHRASES) — assertNoForbiddenLanguage já a executa
// antes desta função, então nenhuma cláusula avaliada abaixo pode conter
// "vencedor"/"melhor opção"/etc. sem já ter lançado ProtocolError primeiro.
function hasUnnegatedOccurrenceOfPhrase(text: string, phrase: string): boolean {
  if (!text.includes(phrase)) {
    return false;
  }

  return findPhraseOccurrenceIndices(text, phrase).some((index) => !isPhraseOccurrenceNegated(text, index));
}

// Expressões proibidas apenas quando AFIRMADAS — uma negação explícita e
// local (mesmo mecanismo de cláusula acima) é permitida. Distinto de
// ABSOLUTE_FORBIDDEN_PHRASES (nunca aceitas, mesmo negadas). "ranking"
// (CAL-001) e "mais indicado" (CAL-004) chegaram aqui pelo mesmo motivo:
// specification.md do P010 já exige negar "ranking" no texto
// (comparisonSummary), e o modelo produziu, de forma real e observada, a
// mesma necessidade para "mais indicado" (methodExplanation). Nenhuma
// outra entrada de ABSOLUTE_FORBIDDEN_PHRASES foi avaliada nem promovida
// para cá — cada promoção exige sua própria calibração registrada em
// docs/ace/CALIBRATION_REPORT.md, nunca em lote.
const CONTEXTUAL_FORBIDDEN_PHRASES = ["ranking", "mais indicado"];

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

  for (const phrase of ABSOLUTE_FORBIDDEN_PHRASES) {
    if (allText.includes(phrase)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `FinalCuradoria não pode conter a expressão "${phrase}" em nenhum texto — nunca ranking, nota, vencedor ou conteúdo clínico.`,
      });
    }
  }

  for (const phrase of CONTEXTUAL_FORBIDDEN_PHRASES) {
    if (hasUnnegatedOccurrenceOfPhrase(allText, phrase)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `FinalCuradoria não pode conter "${phrase}" fora de uma negação explícita (ex.: "sem ${phrase}", "não existe ${phrase}") — nunca ranking, nota, vencedor ou conteúdo clínico.`,
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
