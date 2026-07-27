// Fixture da cadeia histórica do ACE (P007 → P008 → P009 → P010) — SOMENTE TESTES.
//
// Por que existe (ADR-035 / ADR-036, docs/DECISIONS.md): o ACE deixou de ser
// motor de Curadoria e as superfícies que acionavam P008/P009/P010 foram
// descontinuadas. Os dados históricos, porém, permanecem íntegros e legíveis —
// e é esse histórico que os testes de observabilidade precisam observar. Até
// aqui, montá-lo exigia chamar `runAceExecution`, `submitHumanReview` e
// `deliverFinalCuradoria`: escritores sem chamador de produção, mantidos vivos
// apenas pelas fixtures de teste. Esta fixture insere a cadeia histórica
// diretamente, para que esses escritores possam ser removidos fisicamente.
//
// UMA cadeia, TRÊS pontos de parada — a diferença entre as fixtures públicas é
// apenas onde a cadeia termina:
//
//   ace_executions (+ ace_execution_events)  ← seedLegacyAceExecution para aqui
//     → ace_artifacts (CompatibilityMatrix)
//     → ace_artifacts (Shortlist)
//     → human_review_results                 ← seedLegacyHumanReview para aqui
//     → final_curadoria_deliveries           ← seedLegacyFinalCuradoriaDelivery
//
// O que ela NÃO é: um caminho alternativo de curadoria ou de entrega. Nada
// aqui é acionável pela aplicação, nada roda em produção, e nenhuma decisão é
// tomada — os três profissionais e a ação da revisão chegam prontos de quem
// chama.
//
// Nenhum payload é aproximado ou copiado de log: todos são construídos pelos
// contratos e protocolos reais do repositório —
// `createCompatibilityMatrix` (P007), `p008ShortlistBuilder` (P008),
// `p009HumanReview` (P009) e `createFinalCuradoria` (P010) —, que validam
// invariantes, política de campos e vocabulário proibido exatamente como
// validavam quando o motor estava ligado.
//
// PROVENIÊNCIA SINTÉTICA A MONTANTE: `CompatibilityMatrix.sourceArtifacts`
// exige ao menos uma referência de tipo `DecisionContext`/`CompetencyProfile`/
// `EligibleProviderSet`, e `FinalCuradoria.caseReference` exige um
// `DecisionCase`. Nenhum desses quatro é materializado aqui, de propósito:
//   - esses IDs não possuem linha correspondente em `ace_artifacts`;
//   - nenhum teste histórico restante navega acima da CompatibilityMatrix
//     (quem fazia isso era o próprio P010, que não é mais executado);
//   - a cadeia persistida e observada começa na execução e nos DOIS artefatos
//     materializados (CompatibilityMatrix e Shortlist).
// Materializar artefatos que ninguém lê seria inventar histórico, não
// preservá-lo.

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createCompatibilityMatrix,
  type CompatibilityDimensionResults,
  type CompatibilityMatrix,
  type CreateCompatibilityEntryInput,
} from "@/modules/ace/artifacts/compatibility-matrix";
import { createFinalCuradoria, type ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";
import { p008ShortlistBuilder } from "@/modules/ace/protocols/p008-shortlist-builder";
import { p009HumanReview } from "@/modules/ace/protocols/p009-human-review";

import { changeCaseStatus } from "@/modules/cases/repository";
import { SupabaseProviderPresentationRepository } from "@/modules/concierge/provider-adapters";
import type { AceExecutionEventType, AceExecutionStatus } from "@/modules/concierge/types";

// Mesmo valor declarado em cada protocolo do ACE (p003..p010) e espelhado
// pelo orquestrador. O `protocol_version` das linhas de `ace_artifacts`
// sempre foi igual ao `method_version` — o ACE nunca versionou protocolo
// independentemente do método.
const ACE_METHOD_VERSION = "ACE-0.1";
const REQUIRED_PROVIDER_COUNT = 3;

// As duas ações que efetivamente produziram histórico observado pelos testes:
// APPROVE (revisão VALIDATED, o Caso segue para entrega) e REJECT (revisão
// REJECTED, o Caso volta a aguardar informação).
export type LegacyReviewAction = "APPROVE" | "REJECT";

export type SeedLegacyHumanReviewInput = {
  // Cliente service_role: a fixture escreve histórico, não exercita RLS de
  // escrita. A RLS de LEITURA continua sendo exercitada pelos testes, com os
  // clientes autenticados de cada papel.
  service: SupabaseClient;
  caseId: string;
  // Quem consta no histórico como quem executou, revisou e validou.
  actorId: string;
  // Exatamente três — os mesmos que atravessam toda a cadeia.
  providerProfileIds: string[];
  reviewAction?: LegacyReviewAction;
  // Só tem efeito em REJECT — nunca aplicável a uma revisão VALIDATED.
  returnToProtocol?: ProtocolId | null;
};

export type SeedLegacyFinalCuradoriaDeliveryInput = Omit<
  SeedLegacyHumanReviewInput,
  "reviewAction" | "returnToProtocol"
> & {
  patientProfileId: string;
  // Texto real da história do paciente: é dele que o `decisionSummary`
  // histórico era derivado, verbatim.
  patientGoal: string;
};

// Evento do log estruturado da execução, na forma em que `ace_execution_events`
// o armazena — `message` e `metadata`, nunca um "payload" genérico.
export type LegacyAceExecutionEventInput = {
  eventType: AceExecutionEventType;
  protocolId?: ProtocolId | null;
  message?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
};

export type SeedLegacyAceExecutionInput = {
  service: SupabaseClient;
  caseId: string;
  actorId: string;
  status: AceExecutionStatus;
  currentProtocol?: ProtocolId | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
  events?: LegacyAceExecutionEventInput[];
};

export type LegacyAceExecutionFixture = {
  caseId: string;
  executionId: string;
  executionEventIds: string[];
};

export type LegacyHumanReviewFixture = LegacyAceExecutionFixture & {
  compatibilityMatrixArtifactId: string;
  shortlistArtifactId: string;
  humanReviewResultId: string;
  // Ordenados por providerId — a mesma ordem neutra que atravessa Shortlist,
  // approved_provider_ids e provider_presentations. Vazio quando a revisão
  // histórica é REJECTED (nenhuma composição foi validada).
  providerIds: string[];
};

export type LegacyFinalCuradoriaDeliveryFixture = LegacyHumanReviewFixture & {
  finalDeliveryId: string;
};

// União dos dois pontos de parada — é o que o cleanup aceita, sempre parcial.
export type LegacyAceChainFixture = Partial<LegacyFinalCuradoriaDeliveryFixture>;

// Conteúdo em linguagem natural da entrega. Reproduz o que o pipeline
// histórico de fato produzia para um Caso deste formato (Shortlist COMPOSED,
// revisão APPROVE, decisão "buscar_avaliacao"): o P010 nunca gerou esse texto
// — sempre o recebeu pronto e auditou mecanicamente a ausência de vocabulário
// de ranking, auditoria que `createFinalCuradoria` continua fazendo aqui.
const APPROVE_RATIONALE = "Composição adequada às necessidades relatadas na história.";
const REJECT_RATIONALE = "Faltam informações essenciais sobre a preferência do paciente.";

const COMPARISON_SUMMARY =
  "As três pessoas profissionais abaixo estão organizadas em ordem alfabética, só para facilitar a leitura — a ordem não indica preferência. As três foram cuidadosamente validadas pela equipe Aliviar para o que você trouxe na sua história.";

const METHOD_EXPLANATION =
  "Esta Curadoria foi construída a partir da sua história, analisada pelo Método ACE e validada por um Curador Médico da equipe Aliviar.";

const DISCLAIMER =
  "Esta Curadoria é uma orientação da equipe Aliviar para ajudar você a encontrar apoio adequado — ela nunca substitui uma consulta, diagnóstico ou tratamento médico. As decisões sobre sua saúde são sempre suas, em conversa direta com os profissionais indicados.";

const NEXT_STEPS = [
  "Entre em contato com um dos profissionais indicados quando se sentir pronto(a).",
  "Leve sua história e suas dúvidas para a primeira conversa.",
  "A equipe Aliviar continua disponível se você precisar de apoio neste processo.",
];

// Avaliação por dimensão de um profissional apto, na forma exata que o P007
// produzia para os perfis usados nos testes (competência correspondente ao
// domínio/foco exigidos, nível "experiente" para complexidade "media",
// atendimento por ambas as abordagens, urgência não determinada, nenhuma
// restrição obrigatória registrada e decisão que não envolve acompanhamento
// contínuo). As seis dimensões são obrigatórias e nenhuma essencial pode ser
// INSUFFICIENT — caso contrário o P008 recusaria compor a Shortlist.
function buildQualifiedDimensionResults(): CompatibilityDimensionResults {
  return {
    competencyAlignment: {
      classification: "STRONG",
      rationale: "O provider possui área de competência que corresponde exatamente ao domínio e foco exigidos.",
      evidence: [
        'CompetencyProfile exige domínio "nao_determinado" e foco "avaliacao".',
        "Áreas de competência registradas do provider: nao_determinado/avaliacao.",
      ],
    },
    experienceAlignment: {
      classification: "ADEQUATE",
      rationale: "O provider atende exatamente ao nível de experiência exigido.",
      evidence: [
        "Nível de experiência do provider: experiente.",
        "Nível de experiência exigido pelo CompetencyProfile: experiente.",
      ],
    },
    contextAlignment: {
      classification: "NOT_APPLICABLE",
      rationale: "Urgência do caso não determinada — dimensão não aplicável.",
      evidence: ["Urgência do caso: nao_determinado.", "Janela de disponibilidade do provider: flexible."],
    },
    strategyAlignment: {
      classification: "STRONG",
      rationale: "O provider atende por ambas as abordagens, cobrindo integralmente a estratégia do caso.",
      evidence: ["Abordagem de intake do provider: ambos.", "Estratégia do Contexto de Decisão: avaliacao_inicial."],
    },
    constraintAlignment: {
      classification: "NOT_APPLICABLE",
      rationale: "Nenhuma restrição obrigatória foi registrada para este caso.",
      evidence: [],
    },
    continuityAlignment: {
      classification: "NOT_APPLICABLE",
      rationale: "O tipo de decisão do caso não envolve acompanhamento contínuo — dimensão não aplicável.",
      evidence: ["Tipo de decisão do caso: buscar_avaliacao.", "Oferece cuidado contínuo: sim."],
    },
  };
}

function buildQualifiedEntry(providerId: string): CreateCompatibilityEntryInput {
  return {
    providerId,
    dimensionResults: buildQualifiedDimensionResults(),
    // Derivadas das classificações acima pela mesma regra do P007: STRONG vira
    // força, PARTIAL vira limitação, INSUFFICIENT vira lacuna de informação.
    strengths: ["Forte alinhamento em competência.", "Forte alinhamento em estratégia de abordagem."],
    limitations: [],
    missingInformation: [],
    rationale:
      "Avaliação determinística a partir do Contexto de Decisão e do Perfil de Competência — 2 força(s), 0 limitação(ões) e 0 lacuna(s) de informação identificadas.",
  };
}

function buildCompatibilityMatrix(providerProfileIds: string[]): CompatibilityMatrix {
  return createCompatibilityMatrix({
    entries: providerProfileIds.map(buildQualifiedEntry),
    // Referências sintéticas — ver nota "PROVENIÊNCIA SINTÉTICA A MONTANTE" no
    // topo deste arquivo. O contrato exige ao menos uma; as três são mantidas
    // porque era exatamente esse o trio que o P007 registrava.
    sourceArtifacts: [
      { artifactId: randomUUID(), artifactVersion: 1, artifactType: "DecisionContext" },
      { artifactId: randomUUID(), artifactVersion: 1, artifactType: "CompetencyProfile" },
      { artifactId: randomUUID(), artifactVersion: 1, artifactType: "EligibleProviderSet" },
    ],
    methodVersion: ACE_METHOD_VERSION,
  });
}

// Mesma montagem do P010 (p010-final-curadoria-delivery.ts): identidade e
// apresentação institucional vêm da porta de apresentação; forças e limitações
// vêm da entrada correspondente da CompatibilityMatrix; `whyIncluded` vem da
// justificativa da revisão humana. Nenhum dos dois lados é derivado do outro.
async function buildProviderPresentations(
  service: SupabaseClient,
  approvedProviderIds: string[],
  compatibilityMatrix: CompatibilityMatrix,
): Promise<ProviderPresentation[]> {
  const presentations = await new SupabaseProviderPresentationRepository(service).findByIds(approvedProviderIds);
  const presentationById = new Map(presentations.map((presentation) => [presentation.providerId, presentation]));
  const entryById = new Map(compatibilityMatrix.entries.map((entry) => [entry.providerId, entry]));

  return approvedProviderIds.map((providerId) => {
    const presentation = presentationById.get(providerId);
    if (!presentation) {
      // Falha explícita, nunca preenchimento da lacuna: o leitor de
      // apresentações descarta em silêncio quem não tem professional_summary.
      throw new Error(
        `fixture histórica: não foi possível montar a apresentação do profissional "${providerId}" — display_name/professional_summary precisam estar preenchidos em professional_profiles.`,
      );
    }

    const entry = entryById.get(providerId)!;

    return {
      providerId,
      displayName: presentation.displayName,
      professionalSummary: presentation.professionalSummary,
      whyIncluded: APPROVE_RATIONALE,
      strengthsForThisCase: entry.strengths,
      relevantLimitations: entry.limitations,
      practicalConsiderations: presentation.practicalConsiderations,
    };
  });
}

type ExecutionRowInput = {
  service: SupabaseClient;
  caseId: string;
  actorId: string;
  status: AceExecutionStatus;
  currentProtocol?: ProtocolId | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
};

async function insertExecutionRow(input: ExecutionRowInput): Promise<string> {
  const now = new Date().toISOString();

  const { data, error } = await input.service
    .from("ace_executions")
    .insert({
      case_id: input.caseId,
      started_by: input.actorId,
      started_at: input.startedAt ?? now,
      finished_at: input.finishedAt === undefined ? now : input.finishedAt,
      status: input.status,
      current_protocol: input.currentProtocol ?? null,
      method_version: ACE_METHOD_VERSION,
      failure_code: input.failureCode ?? null,
      failure_message: input.failureMessage ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`fixture histórica: falha ao inserir ace_executions — ${error?.message ?? "sem linha retornada"}`);
  }

  return data.id as string;
}

async function insertExecutionEvents(
  service: SupabaseClient,
  caseId: string,
  executionId: string,
  events: LegacyAceExecutionEventInput[],
): Promise<string[]> {
  if (events.length === 0) return [];

  const { data, error } = await service
    .from("ace_execution_events")
    .insert(
      events.map((event) => ({
        execution_id: executionId,
        case_id: caseId,
        event_type: event.eventType,
        protocol_id: event.protocolId ?? null,
        // `message` é NOT NULL: um evento sem mensagem nunca existiu no
        // histórico, então a fixture registra a mesma frase mínima que o
        // orquestrador registrava — nunca uma string vazia.
        message: event.message ?? `Evento ${event.eventType} registrado pela execução.`,
        metadata: event.metadata ?? {},
        ...(event.occurredAt ? { created_at: event.occurredAt } : {}),
      })),
    )
    .select("id");

  if (error || !data) {
    throw new Error(
      `fixture histórica: falha ao inserir ace_execution_events — ${error?.message ?? "sem linhas retornadas"}`,
    );
  }

  return data.map((row) => row.id as string);
}

// Estado final coerente com o que a própria revisão produziu: APPROVE deixa a
// execução concluída no P008; REJECT com retorno a um estágio anterior deixa a
// execução BLOQUEADA nesse estágio, com o mesmo código de falha que o
// histórico registrava.
async function insertReviewExecution(
  input: SeedLegacyHumanReviewInput,
  reviewAction: LegacyReviewAction,
  returnToProtocol: ProtocolId | null,
): Promise<string> {
  const blocked = reviewAction === "REJECT" && returnToProtocol !== null;

  return insertExecutionRow({
    service: input.service,
    caseId: input.caseId,
    actorId: input.actorId,
    status: blocked ? "BLOCKED" : "COMPLETED",
    currentProtocol: blocked ? returnToProtocol : "P008",
    failureCode: blocked ? "HUMAN_REVIEW_RETURN" : null,
    failureMessage: blocked
      ? `Retorno solicitado ao estágio ${returnToProtocol}. Artefatos downstream serão recalculados na próxima execução.`
      : null,
  });
}

async function insertArtifact(
  input: SeedLegacyHumanReviewInput,
  executionId: string,
  artifactType: "CompatibilityMatrix" | "Shortlist",
  protocolId: "P007" | "P008",
  payload: CompatibilityMatrix | Shortlist,
): Promise<string> {
  // `ace_artifacts.id` sempre foi o próprio id do artefato — é o que permite
  // que uma referência de proveniência dentro de um payload seja resolvida
  // como chave primária de outra linha.
  const { error } = await input.service.from("ace_artifacts").insert({
    id: payload.id,
    case_id: input.caseId,
    execution_id: executionId,
    artifact_type: artifactType,
    version: payload.version,
    protocol_id: protocolId,
    protocol_version: ACE_METHOD_VERSION,
    method_version: ACE_METHOD_VERSION,
    payload,
    created_by: input.actorId,
  });

  if (error) {
    throw new Error(`fixture histórica: falha ao inserir ace_artifacts (${artifactType}) — ${error.message}`);
  }

  return payload.id;
}

async function insertHumanReviewResult(
  input: SeedLegacyHumanReviewInput,
  executionId: string,
  humanReviewResult: HumanReviewResult,
): Promise<string> {
  const { error } = await input.service.from("human_review_results").insert({
    id: humanReviewResult.id,
    case_id: input.caseId,
    execution_id: executionId,
    reviewer_id: humanReviewResult.reviewerId,
    reviewed_at: humanReviewResult.reviewedAt,
    review_status: humanReviewResult.reviewStatus,
    review_action: humanReviewResult.reviewAction,
    original_shortlist_artifact_id: humanReviewResult.originalShortlistReference.artifactId,
    original_shortlist_artifact_version: humanReviewResult.originalShortlistReference.artifactVersion,
    compatibility_matrix_artifact_id: humanReviewResult.compatibilityMatrixReference.artifactId,
    compatibility_matrix_artifact_version: humanReviewResult.compatibilityMatrixReference.artifactVersion,
    approved_provider_ids: humanReviewResult.approvedProviderIds,
    changes: humanReviewResult.changes,
    review_rationale: humanReviewResult.reviewRationale,
    evidence_references: humanReviewResult.evidenceReferences,
    return_to_protocol: humanReviewResult.returnToProtocol,
    method_version: humanReviewResult.methodVersion,
    version: humanReviewResult.version,
  });

  if (error) {
    throw new Error(`fixture histórica: falha ao inserir human_review_results — ${error.message}`);
  }

  return humanReviewResult.id;
}

function assertThreeProviders(providerProfileIds: string[]): void {
  if (providerProfileIds.length !== REQUIRED_PROVIDER_COUNT) {
    throw new Error(
      `fixture histórica: são necessários exatamente ${REQUIRED_PROVIDER_COUNT} profissionais — recebidos ${providerProfileIds.length}.`,
    );
  }
}

// Núcleo compartilhado pelos dois pontos de parada. Devolve também os
// artefatos em memória, porque a entrega precisa deles e reconstruí-los a
// partir do banco seria reinterpretar o histórico em vez de preservá-lo.
async function seedChainUpToHumanReview(
  input: SeedLegacyHumanReviewInput,
  partial: LegacyAceChainFixture,
): Promise<{
  fixture: LegacyHumanReviewFixture;
  compatibilityMatrix: CompatibilityMatrix;
  humanReviewResult: HumanReviewResult;
}> {
  const reviewAction = input.reviewAction ?? "APPROVE";
  const returnToProtocol = reviewAction === "REJECT" ? (input.returnToProtocol ?? null) : null;

  const compatibilityMatrix = buildCompatibilityMatrix(input.providerProfileIds);
  const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix });

  if (shortlist.status !== "COMPOSED" || shortlist.selectedProviderIds.length !== REQUIRED_PROVIDER_COUNT) {
    throw new Error(
      `fixture histórica: a Shortlist precisa ser COMPOSED com ${REQUIRED_PROVIDER_COUNT} profissionais — obtido "${shortlist.status}" com ${shortlist.selectedProviderIds.length}.`,
    );
  }

  // O Caso entra em curadoria e chega à revisão humana antes de a decisão ser
  // registrada — mesma sequência do histórico real.
  await changeCaseStatus(input.service, input.caseId, "IN_CURATION", input.actorId);
  await changeCaseStatus(input.service, input.caseId, "HUMAN_REVIEW", input.actorId);

  const executionId = await insertReviewExecution(input, reviewAction, returnToProtocol);
  partial.executionId = executionId;
  partial.executionEventIds = [];

  const compatibilityMatrixArtifactId = await insertArtifact(
    input,
    executionId,
    "CompatibilityMatrix",
    "P007",
    compatibilityMatrix,
  );
  partial.compatibilityMatrixArtifactId = compatibilityMatrixArtifactId;

  const shortlistArtifactId = await insertArtifact(input, executionId, "Shortlist", "P008", shortlist);
  partial.shortlistArtifactId = shortlistArtifactId;

  const humanReviewResult = await p009HumanReview.execute({
    shortlist,
    compatibilityMatrix,
    reviewerId: input.actorId,
    reviewAction,
    reviewRationale: reviewAction === "APPROVE" ? APPROVE_RATIONALE : REJECT_RATIONALE,
    evidenceReferences: reviewAction === "APPROVE" ? ["Shortlist.compositionRationale"] : [],
    changes: [],
    returnToProtocol,
  });
  const humanReviewResultId = await insertHumanReviewResult(input, executionId, humanReviewResult);
  partial.humanReviewResultId = humanReviewResultId;

  // Uma revisão que não valida devolve o Caso para quem precisa agir — a
  // transição fazia parte do histórico tanto quanto a linha da revisão.
  if (humanReviewResult.reviewStatus !== "VALIDATED") {
    await changeCaseStatus(input.service, input.caseId, "WAITING_FOR_INFORMATION", input.actorId);
  }

  // Ordem neutra e determinística por providerId — nunca preferência.
  const providerIds = [...humanReviewResult.approvedProviderIds].sort((a, b) => a.localeCompare(b));
  partial.providerIds = providerIds;

  return {
    fixture: {
      caseId: input.caseId,
      executionId,
      executionEventIds: [],
      compatibilityMatrixArtifactId,
      shortlistArtifactId,
      humanReviewResultId,
      providerIds,
    },
    compatibilityMatrix,
    humanReviewResult,
  };
}

// A limpeza do que já entrou nunca substitui o erro que interrompeu a fixture
// — ela é anexada, e o erro original é relançado como causa.
async function rollbackPartial(
  service: SupabaseClient,
  partial: LegacyAceChainFixture,
  error: unknown,
): Promise<never> {
  try {
    await cleanupLegacyAceChain(service, partial);
  } catch (cleanupError) {
    throw new Error(
      `fixture histórica interrompida e limpeza parcial também falhou (${(cleanupError as Error).message})`,
      { cause: error },
    );
  }
  throw error;
}

/**
 * Ponto de parada mais raso da cadeia: uma execução histórica e, opcionalmente,
 * o seu log estruturado — sem nenhum artefato, revisão ou entrega.
 *
 *   ace_executions (+ ace_execution_events)
 *
 * Serve ao que se observa sobre a execução em si: append-only e RLS dos
 * eventos, o índice de concorrência de `RUNNING`, e uma execução FAILED com
 * `failure_code`/`failure_message` reais — os campos que o Portal do Paciente
 * nunca pode expor.
 *
 * Não mexe no status do Caso: quem chama decide em que estado o Caso estava
 * quando essa execução aconteceu, porque uma execução isolada não implica uma
 * transição específica.
 */
export async function seedLegacyAceExecution(
  input: SeedLegacyAceExecutionInput,
): Promise<LegacyAceExecutionFixture> {
  const partial: LegacyAceChainFixture = { caseId: input.caseId };

  try {
    const executionId = await insertExecutionRow(input);
    partial.executionId = executionId;

    const executionEventIds = await insertExecutionEvents(
      input.service,
      input.caseId,
      executionId,
      input.events ?? [],
    );
    partial.executionEventIds = executionEventIds;

    return { caseId: input.caseId, executionId, executionEventIds };
  } catch (error) {
    return rollbackPartial(input.service, partial, error);
  }
}

/**
 * Insere a cadeia histórica até a decisão de revisão humana, sem passar por
 * nenhum escritor do ACE e sem produzir entrega.
 *
 *   ace_executions → CompatibilityMatrix → Shortlist → human_review_results
 *
 * O Caso precisa estar em READY_FOR_CURATION. Com `reviewAction: "APPROVE"`
 * (padrão) ele permanece em HUMAN_REVIEW; com `"REJECT"` ele volta para
 * WAITING_FOR_INFORMATION — sempre por `changeCaseStatus`, nunca escrevendo
 * `cases.status` diretamente.
 *
 * Se qualquer etapa falhar, o que já foi inserido é removido antes de o erro
 * original ser relançado.
 */
export async function seedLegacyHumanReview(input: SeedLegacyHumanReviewInput): Promise<LegacyHumanReviewFixture> {
  assertThreeProviders(input.providerProfileIds);
  const partial: LegacyAceChainFixture = { caseId: input.caseId };

  try {
    const { fixture } = await seedChainUpToHumanReview(input, partial);
    return fixture;
  } catch (error) {
    return rollbackPartial(input.service, partial, error);
  }
}

/**
 * Insere a cadeia histórica completa, até a Entrega Final da Curadoria.
 *
 *   ace_executions → CompatibilityMatrix → Shortlist → human_review_results
 *     → final_curadoria_deliveries
 *
 * O Caso precisa estar em READY_FOR_CURATION; a fixture o conduz pelas
 * transições permitidas até DELIVERED.
 */
export async function seedLegacyFinalCuradoriaDelivery(
  input: SeedLegacyFinalCuradoriaDeliveryInput,
): Promise<LegacyFinalCuradoriaDeliveryFixture> {
  assertThreeProviders(input.providerProfileIds);
  const partial: LegacyAceChainFixture = { caseId: input.caseId };

  try {
    const { fixture, compatibilityMatrix, humanReviewResult } = await seedChainUpToHumanReview(
      { ...input, reviewAction: "APPROVE", returnToProtocol: null },
      partial,
    );

    const providerPresentations = await buildProviderPresentations(
      input.service,
      fixture.providerIds,
      compatibilityMatrix,
    );

    const finalCuradoria = createFinalCuradoria({
      validatedBy: humanReviewResult.reviewerId,
      validatedAt: humanReviewResult.reviewedAt,
      humanReviewReference: {
        artifactId: humanReviewResult.id,
        artifactVersion: humanReviewResult.version,
        artifactType: "HumanReviewResult",
      },
      // Referência sintética — ver nota no topo do arquivo.
      caseReference: { artifactId: randomUUID(), artifactVersion: 1, artifactType: "DecisionCase" },
      generatedAt: new Date().toISOString(),
      decisionSummary: `Você nos contou: "${input.patientGoal}"`,
      clientContextSummary: "Você está buscando buscar uma avaliação inicial.",
      providerPresentations,
      comparisonSummary: COMPARISON_SUMMARY,
      relevantLimitations: providerPresentations.flatMap((presentation) =>
        presentation.relevantLimitations.map((limitation) => `${presentation.providerId}: ${limitation}`),
      ),
      relevantMissingInformation: fixture.providerIds.flatMap((providerId) => {
        const entry = compatibilityMatrix.entries.find((candidate) => candidate.providerId === providerId)!;
        return entry.missingInformation.map((item) => `${providerId}: ${item}`);
      }),
      nextSteps: NEXT_STEPS,
      methodExplanation: METHOD_EXPLANATION,
      disclaimer: DISCLAIMER,
      methodVersion: ACE_METHOD_VERSION,
    });

    const { error: deliveryError } = await input.service.from("final_curadoria_deliveries").insert({
      id: finalCuradoria.id,
      case_id: input.caseId,
      patient_profile_id: input.patientProfileId,
      human_review_result_id: humanReviewResult.id,
      validated_by: finalCuradoria.validatedBy,
      validated_at: finalCuradoria.validatedAt,
      delivered_by: input.actorId,
      generated_at: finalCuradoria.generatedAt,
      decision_summary: finalCuradoria.decisionSummary,
      client_context_summary: finalCuradoria.clientContextSummary,
      provider_presentations: finalCuradoria.providerPresentations,
      comparison_summary: finalCuradoria.comparisonSummary,
      relevant_limitations: finalCuradoria.relevantLimitations,
      relevant_missing_information: finalCuradoria.relevantMissingInformation,
      next_steps: finalCuradoria.nextSteps,
      method_explanation: finalCuradoria.methodExplanation,
      disclaimer: finalCuradoria.disclaimer,
      method_version: finalCuradoria.methodVersion,
      version: finalCuradoria.version,
    });

    if (deliveryError) {
      throw new Error(`fixture histórica: falha ao inserir final_curadoria_deliveries — ${deliveryError.message}`);
    }
    partial.finalDeliveryId = finalCuradoria.id;

    await changeCaseStatus(input.service, input.caseId, "DELIVERED", input.actorId);

    return { ...fixture, finalDeliveryId: finalCuradoria.id };
  } catch (error) {
    return rollbackPartial(input.service, partial, error);
  }
}

/**
 * Remove a cadeia histórica na ordem inversa da inserção. Nunca depende de
 * cascade: `human_review_results.execution_id`, as duas referências de
 * artefato e `final_curadoria_deliveries.human_review_result_id` são FKs sem
 * `on delete cascade`, então qualquer outra ordem falharia.
 *
 * O Caso, o paciente e os profissionais são de quem chama — a fixture nunca os
 * criou e não os remove.
 *
 * Aceita fixture parcial (qualquer um dos dois pontos de parada, ou uma cadeia
 * interrompida no meio): campos ausentes são simplesmente pulados. Todos os
 * erros de DELETE são coletados e relançados juntos, nunca engolidos.
 */
export async function cleanupLegacyAceChain(service: SupabaseClient, fixture: LegacyAceChainFixture): Promise<void> {
  const failures: string[] = [];

  async function remove(table: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await service.from(table).delete().in("id", ids);
    if (error) {
      failures.push(`${table}: ${error.message}`);
    }
  }

  await remove("final_curadoria_deliveries", fixture.finalDeliveryId ? [fixture.finalDeliveryId] : []);
  await remove("human_review_results", fixture.humanReviewResultId ? [fixture.humanReviewResultId] : []);
  await remove(
    "ace_artifacts",
    [fixture.shortlistArtifactId, fixture.compatibilityMatrixArtifactId].filter((id): id is string => Boolean(id)),
  );
  // Eventos antes da execução que os contém — nunca confiando no cascade.
  await remove("ace_execution_events", fixture.executionEventIds ?? []);
  await remove("ace_executions", fixture.executionId ? [fixture.executionId] : []);

  if (failures.length > 0) {
    throw new Error(`limpeza da fixture histórica falhou — ${failures.join("; ")}`);
  }
}
