import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProtocolId } from "@/modules/ace/core/protocol-id";
import { createNarrative, type Narrative } from "@/modules/ace/artifacts/narrative";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { listActiveP002FieldCorrections } from "@/modules/ace/p002-field-corrections-repository";
import { p002CaseBuilder, type P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";
import { applyHumanCorrectionsToMissingInformation } from "@/modules/ace/protocols/p002-human-overrides";
import { p003CaseAudit, type P003AdditionalFinding } from "@/modules/ace/protocols/p003-case-audit";
import { p004DecisionContextModeler, type P004Modeling } from "@/modules/ace/protocols/p004-decision-context-modeler";
import { p005CompetencyProfileBuilder } from "@/modules/ace/protocols/p005-competency-profile-builder";
import { p006EligibleProviderSetBuilder } from "@/modules/ace/protocols/p006-eligible-provider-set-builder";
import { p007CompatibilityMatrixBuilder } from "@/modules/ace/protocols/p007-compatibility-matrix-builder";
import { p008ShortlistBuilder } from "@/modules/ace/protocols/p008-shortlist-builder";
import type { ProviderRepository } from "@/modules/ace/ports/provider-repository";
import type { ProviderProfileRepository } from "@/modules/ace/ports/provider-profile-repository";

import { changeCaseStatus, getCase } from "@/modules/cases/repository";
import { getStoryById } from "@/modules/story/repository";
import type { PatientStory } from "@/modules/story/types";

import {
  createExecution,
  getExecution,
  getLatestArtifactByType,
  getLatestExecution,
  logExecutionEvent,
  persistArtifact,
  updateExecution,
} from "./execution-repository";
import { getLatestReturnProtocolForCase } from "./human-review-repository";
import { isProtocolAtOrAfterReturnPoint } from "./return-to-protocol";
import { AceLanguageModelConfigurationError, getAceLanguageModel, type AceLanguageModel } from "./language-model";
import { SupabaseProviderProfileRepository, SupabaseProviderRepository } from "./provider-adapters";
import type { AceExecution, AceArtifactType } from "./types";

// Mesmo valor declarado (mas não exportado) em cada arquivo de protocolo do
// ACE (p003..p008, const METHOD_VERSION = "ACE-0.1"). Não há como importar
// o valor diretamente sem alterar o módulo ace (congelado) — mantido aqui
// como constante espelhada, documentada, para P001/P002 (cujos artefatos
// não carregam methodVersion próprio) e como protocolVersion de todos os
// artefatos (o ACE ainda não versiona protocolo independentemente do
// método como um todo).
const ACE_METHOD_VERSION = "ACE-0.1";

export type RunAceExecutionParams = {
  supabase: SupabaseClient;
  caseId: string;
  actorId: string;
  // Opcional de propósito: em produção, a resolução real (Anthropic vs
  // falha explícita) acontece dentro do próprio orquestrador — nunca antes
  // de existir uma execução para registrar o resultado. Testes/integrações
  // continuam podendo injetar um modelo próprio (ex.: FakeAceLanguageModel)
  // diretamente, sem depender de variável de ambiente.
  languageModel?: AceLanguageModel;
  providerRepository?: ProviderRepository;
  providerProfileRepository?: ProviderProfileRepository;
};

export type RunAceExecutionResult =
  | { outcome: "completed"; execution: AceExecution }
  | { outcome: "blocked"; execution: AceExecution }
  | { outcome: "failed"; execution: AceExecution }
  | { outcome: "error"; error: string };

function buildNarrativeFromStory(story: PatientStory): Narrative {
  // Preserva o texto do paciente literalmente — nunca resume, reescreve ou
  // interpreta. Rótulos (":") servem só para organizar visualmente os três
  // campos, nunca alteram o conteúdo.
  const parts: string[] = [];
  if (story.data.motivo?.trim()) parts.push(`Motivo: ${story.data.motivo}`);
  if (story.data.historia?.trim()) parts.push(`História: ${story.data.historia}`);
  if (story.data.informacoesImportantes?.trim()) {
    parts.push(`Informações importantes: ${story.data.informacoesImportantes}`);
  }

  return createNarrative({
    text: parts.join("\n\n"),
    closingQuestionsAnswered: {
      historia: Boolean(story.data.historia?.trim()),
      decisao: Boolean(story.data.motivo?.trim()),
      objetivo: Boolean(story.data.informacoesImportantes?.trim()),
    },
  });
}

// Mensagem única, sempre a mesma, para toda falha relacionada ao modelo de
// linguagem (configuração ausente, autenticação, rate limit, timeout,
// indisponibilidade, resposta incompatível) — o Curador Médico nunca vê
// detalhe técnico; o motivo específico (para busca/auditoria) vive só em
// `failureCode`, nunca nesta frase.
const ACE_MODEL_FAILURE_MESSAGE =
  "A execução do ACE não pôde ser concluída neste momento. Verifique a configuração do modelo de linguagem ou tente novamente mais tarde.";

async function failWithLanguageModelError(
  supabase: SupabaseClient,
  caseId: string,
  executionId: string,
  protocolId: ProtocolId | null,
  failureCode: string,
): Promise<RunAceExecutionResult> {
  await updateExecution(supabase, executionId, {
    status: "FAILED",
    finishedAt: new Date().toISOString(),
    failureCode,
    failureMessage: ACE_MODEL_FAILURE_MESSAGE,
  });
  await logExecutionEvent(supabase, {
    executionId,
    caseId,
    eventType: "FAILED",
    protocolId,
    message: ACE_MODEL_FAILURE_MESSAGE,
    metadata: { failureCode },
  });
  const execution = await getExecution(supabase, executionId);
  return { outcome: "failed", execution: execution! };
}

// Orquestrador mínimo do pipeline ACE P001-P008 (ÉPICO 1/SPRINT 3). O ACE
// nunca inicia sozinho: esta função só é chamada a partir de uma ação de
// servidor já autorizada (administrador ou curador médico atribuído — ver
// actions.ts). Cada etapa persiste seu artefato antes de seguir para a
// próxima; retomar uma execução (chamar de novo após FAILED/BLOCKED)
// reaproveita os artefatos já persistidos, nunca os recalcula.
export async function runAceExecution(params: RunAceExecutionParams): Promise<RunAceExecutionResult> {
  const { supabase, caseId, actorId } = params;
  const providerRepository = params.providerRepository ?? new SupabaseProviderRepository(supabase);
  const providerProfileRepository = params.providerProfileRepository ?? new SupabaseProviderProfileRepository(supabase);

  const kase = await getCase(supabase, caseId);
  if (!kase) {
    return { outcome: "error", error: "Caso não encontrado." };
  }

  if (kase.status !== "READY_FOR_CURATION" && kase.status !== "IN_CURATION") {
    return {
      outcome: "error",
      error: 'O caso precisa estar em "Pronto para curadoria" ou "Em curadoria" para executar o ACE.',
    };
  }

  const story = await getStoryById(supabase, kase.sourceStoryId);
  if (!story || story.status !== "enviada") {
    return { outcome: "error", error: "A história de origem deste caso não está disponível ou não foi enviada." };
  }

  const latest = await getLatestExecution(supabase, caseId);
  let execution: AceExecution;

  if (latest?.status === "RUNNING") {
    execution = latest;
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "RESUMED",
      message: "Retomando execução que permanecia em andamento (possível interrupção anterior).",
    });
  } else if (latest?.status === "FAILED" || latest?.status === "BLOCKED") {
    execution = await createExecution(supabase, caseId, actorId, ACE_METHOD_VERSION, latest.id);
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "RESUMED",
      message: `Nova tentativa após ${latest.status === "FAILED" ? "falha" : "bloqueio"} da execução anterior.`,
      metadata: { retryOf: latest.id },
    });
  } else if (!latest || latest.status === "CANCELLED") {
    execution = await createExecution(supabase, caseId, actorId, ACE_METHOD_VERSION, null);
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "STARTED",
      message: "Execução iniciada.",
    });
  } else {
    return { outcome: "error", error: "Este caso já tem uma execução do ACE concluída." };
  }

  if (kase.status === "READY_FOR_CURATION") {
    await changeCaseStatus(supabase, caseId, "IN_CURATION", actorId);
  }

  // Espelha o current_protocol persistido — a variável `execution` capturada
  // acima nunca é reatribuída, então o log de falha (catch) usa esta cópia
  // local em vez de arriscar reportar um protocolo desatualizado.
  let currentProtocolId: ProtocolId | null = execution.currentProtocol;
  const returnProtocol = await getLatestReturnProtocolForCase(supabase, caseId);

  async function reuseOrPersist<T>(
    artifactType: AceArtifactType,
    protocolId: "P001" | "P002" | "P003" | "P004" | "P005" | "P006" | "P007" | "P008",
    compute: () => Promise<{ artifact: T & { id: string; version: number }; methodVersion: string; blocked?: boolean }>,
  ): Promise<T> {
    const skipReuse =
      returnProtocol !== null && isProtocolAtOrAfterReturnPoint(protocolId, returnProtocol);

    if (!skipReuse) {
      const existing = await getLatestArtifactByType(supabase, caseId, artifactType);
      if (existing) {
        await logExecutionEvent(supabase, {
          executionId: execution.id,
          caseId,
          eventType: "ARTIFACT_REUSED",
          protocolId,
          message: `Reaproveitando ${artifactType} já validado (versão ${existing.version}) — não recalculado.`,
          metadata: { artifactType, version: existing.version },
        });
        return existing.payload as T;
      }
    } else {
      await logExecutionEvent(supabase, {
        executionId: execution.id,
        caseId,
        eventType: "PROTOCOL_STARTED",
        protocolId,
        message: `Recalculando ${artifactType} após retorno humano a ${returnProtocol}.`,
        metadata: { artifactType, returnProtocol },
      });
    }

    currentProtocolId = protocolId;
    await updateExecution(supabase, execution.id, { currentProtocol: protocolId });
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "PROTOCOL_STARTED",
      protocolId,
      message: `Executando ${protocolId} (${artifactType}).`,
    });

    const { artifact, methodVersion, blocked } = await compute();

    await persistArtifact(supabase, {
      id: artifact.id,
      caseId,
      executionId: execution.id,
      artifactType,
      version: artifact.version,
      protocolId,
      protocolVersion: methodVersion,
      methodVersion,
      payload: artifact,
      createdBy: actorId,
      validationStatus: blocked ? "blocked" : "valid",
    });

    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "PROTOCOL_COMPLETED",
      protocolId,
      message: `${protocolId} concluído — artefato ${artifactType} persistido (versão ${artifact.version}).`,
      metadata: { artifactType, version: artifact.version, validationStatus: blocked ? "blocked" : "valid" },
    });

    return artifact as T;
  }

  try {
    // Resolvida aqui dentro (não antes) de propósito: só depois que a
    // execução já existe é possível registrar, com failureCode e timeline
    // próprios, o caso de configuração ausente — nunca um throw cru na
    // action, sem rastro nenhum. Em produção sem CLAUDE_API_KEY, isto
    // lança AceLanguageModelConfigurationError e nunca chega a usar o
    // modelo fake (getAceLanguageModel, language-model.ts).
    const languageModel = params.languageModel ?? (await getAceLanguageModel());

    const narrative = await reuseOrPersist<Narrative>("Narrative", "P001", async () => ({
      artifact: buildNarrativeFromStory(story),
      methodVersion: ACE_METHOD_VERSION,
    }));

    const decisionCase = await reuseOrPersist<DecisionCase>("DecisionCase", "P002", async () => {
      const llmResponse = await languageModel.run<{ narrative: Narrative }, P002ExtractedFields>({
        protocolId: "P002",
        protocolVersion: ACE_METHOD_VERSION,
        prompt: "p002-case-builder",
        input: { narrative },
      });

      if (llmResponse.metadata.status === "error" || !llmResponse.output) {
        throw new LanguageModelFailure("P002", llmResponse.metadata.error?.code ?? "ACE_MODEL_INVALID_RESPONSE");
      }

      const result = await p002CaseBuilder.execute({ narrative, extractedFields: llmResponse.output });

      const humanCorrections = await listActiveP002FieldCorrections(supabase, caseId);
      const artifact: DecisionCase =
        humanCorrections.length > 0
          ? {
              ...result,
              missingInformation: applyHumanCorrectionsToMissingInformation(
                narrative,
                result.missingInformation,
                humanCorrections,
              ),
            }
          : result;

      return { artifact, methodVersion: ACE_METHOD_VERSION };
    });

    const caseAudit = await reuseOrPersist<CaseAudit>("CaseAudit", "P003", async () => {
      const llmResponse = await languageModel.run<
        { decisionCase: DecisionCase },
        { additionalFindings: P003AdditionalFinding[] }
      >({
        protocolId: "P003",
        protocolVersion: ACE_METHOD_VERSION,
        prompt: "p003-case-audit",
        input: { decisionCase },
      });

      if (llmResponse.metadata.status === "error" || !llmResponse.output) {
        throw new LanguageModelFailure("P003", llmResponse.metadata.error?.code ?? "ACE_MODEL_INVALID_RESPONSE");
      }

      const result = await p003CaseAudit.execute({
        decisionCase,
        additionalFindings: llmResponse.output.additionalFindings,
      });
      return { artifact: result, methodVersion: result.methodVersion, blocked: result.status === "BLOCKED" };
    });

    if (caseAudit.status === "BLOCKED") {
      const failureMessage = "A auditoria do caso identificou pendências que impedem a curadoria de prosseguir.";
      await updateExecution(supabase, execution.id, {
        status: "BLOCKED",
        currentProtocol: "P003",
        finishedAt: new Date().toISOString(),
        failureCode: "CASE_AUDIT_BLOCKED",
        failureMessage,
      });
      await logExecutionEvent(supabase, {
        executionId: execution.id,
        caseId,
        eventType: "BLOCKED",
        protocolId: "P003",
        message: failureMessage,
        metadata: { failureCode: "CASE_AUDIT_BLOCKED" },
      });
      await changeCaseStatus(supabase, caseId, "WAITING_FOR_INFORMATION", actorId);
      return { outcome: "blocked", execution: (await getExecution(supabase, execution.id))! };
    }

    const decisionContext = await reuseOrPersist("DecisionContext", "P004", async () => {
      const llmResponse = await languageModel.run<
        { decisionCase: DecisionCase; caseAudit: CaseAudit },
        P004Modeling
      >({
        protocolId: "P004",
        protocolVersion: ACE_METHOD_VERSION,
        prompt: "p004-decision-context-modeler",
        input: { decisionCase, caseAudit },
      });

      if (llmResponse.metadata.status === "error" || !llmResponse.output) {
        throw new LanguageModelFailure("P004", llmResponse.metadata.error?.code ?? "ACE_MODEL_INVALID_RESPONSE");
      }

      const result = await p004DecisionContextModeler.execute({
        decisionCase,
        caseAudit,
        modeling: llmResponse.output,
      });
      return { artifact: result, methodVersion: result.methodVersion };
    });

    const competencyProfile = await reuseOrPersist("CompetencyProfile", "P005", async () => {
      const result = await p005CompetencyProfileBuilder.execute(decisionContext);
      return { artifact: result, methodVersion: result.methodVersion };
    });

    const eligibleProviderSet = await reuseOrPersist("EligibleProviderSet", "P006", async () => {
      const result = await p006EligibleProviderSetBuilder.execute({ competencyProfile, providerRepository });
      return { artifact: result, methodVersion: result.methodVersion };
    });

    const compatibilityMatrix = await reuseOrPersist("CompatibilityMatrix", "P007", async () => {
      const result = await p007CompatibilityMatrixBuilder.execute({
        decisionContext,
        competencyProfile,
        eligibleProviderSet,
        providerProfileRepository,
      });
      return { artifact: result, methodVersion: result.methodVersion };
    });

    const shortlist = await reuseOrPersist("Shortlist", "P008", async () => {
      const result = await p008ShortlistBuilder.execute({ compatibilityMatrix });
      return { artifact: result, methodVersion: result.methodVersion, blocked: result.status === "BLOCKED" };
    });

    if (shortlist.status === "BLOCKED") {
      const failureCode = `SHORTLIST_${shortlist.blockedReason}`;
      const failureMessage = "A composição da Shortlist não pôde ser concluída automaticamente — revisão humana necessária.";
      await updateExecution(supabase, execution.id, {
        status: "BLOCKED",
        currentProtocol: "P008",
        finishedAt: new Date().toISOString(),
        failureCode,
        failureMessage,
      });
      await logExecutionEvent(supabase, {
        executionId: execution.id,
        caseId,
        eventType: "BLOCKED",
        protocolId: "P008",
        message: failureMessage,
        metadata: { failureCode },
      });
      await changeCaseStatus(supabase, caseId, "HUMAN_REVIEW", actorId);
      return { outcome: "blocked", execution: (await getExecution(supabase, execution.id))! };
    }

    await updateExecution(supabase, execution.id, {
      status: "COMPLETED",
      currentProtocol: "P008",
      finishedAt: new Date().toISOString(),
    });
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "COMPLETED",
      message: "P001 a P008 concluídos — Shortlist interna produzida (ainda não representa curadoria validada).",
    });
    await changeCaseStatus(supabase, caseId, "HUMAN_REVIEW", actorId);
    return { outcome: "completed", execution: (await getExecution(supabase, execution.id))! };
  } catch (error) {
    // Ausência de configuração em produção (getAceLanguageModel) — nunca
    // usa o modelo fake, nunca avança para o próximo protocolo, sempre
    // registra a execução como FAILED com um código estável e pesquisável.
    if (error instanceof AceLanguageModelConfigurationError) {
      return failWithLanguageModelError(supabase, caseId, execution.id, currentProtocolId, "ACE_MODEL_NOT_CONFIGURED");
    }

    if (error instanceof LanguageModelFailure) {
      return failWithLanguageModelError(supabase, caseId, execution.id, error.protocolId, error.code);
    }

    const isProtocolError = error instanceof ProtocolError;
    const failureCode = isProtocolError ? error.code : "UNEXPECTED_ERROR";
    // Sempre sanitizada — nunca stack trace ou detalhe de infraestrutura.
    const failureMessage = isProtocolError
      ? error.message
      : "Não foi possível concluir a execução agora. Tente novamente.";
    await updateExecution(supabase, execution.id, {
      status: "FAILED",
      finishedAt: new Date().toISOString(),
      failureCode,
      failureMessage,
    });
    await logExecutionEvent(supabase, {
      executionId: execution.id,
      caseId,
      eventType: "FAILED",
      protocolId: currentProtocolId,
      message: failureMessage,
      metadata: { failureCode },
    });
    return { outcome: "failed", execution: (await getExecution(supabase, execution.id))! };
  }
}

class LanguageModelFailure extends Error {
  constructor(
    readonly protocolId: ProtocolId,
    readonly code: string,
  ) {
    super(`Falha do modelo de linguagem em ${protocolId}: ${code}`);
  }
}
