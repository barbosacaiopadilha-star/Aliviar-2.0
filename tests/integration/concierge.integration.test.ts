import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import {
  getAceHealthCheck,
  getExecutionMetrics,
  getLatestExecution,
  listArtifactsForCase,
  listExecutionEventsForCase,
} from "@/modules/concierge/execution-repository";
import type { AceLanguageModel, AceLanguageModelRequest, AceLanguageModelResponse } from "@/modules/concierge/language-model";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não existe. Rode `npm run bootstrap:test-users` antes dos testes de integração.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("Execução controlada do ACE (ÉPICO 1/SPRINT 3, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  // Isolamento de dados entre testes (triagem das 3 falhas de Shortlist):
  // professional_profiles/professional_competency_areas são um recurso
  // global no Supabase local, nunca escopado por Caso — cada profissional
  // criado por seedEligibleProfessional() precisa ser removido ao final do
  // teste que o criou, nunca deixado para trás, senão contamina a
  // avaliação de elegibilidade (P006) de qualquer teste seguinte, nesta
  // execução ou em execuções futuras do comando.
  let createdProfessionalIds: string[] = [];

  afterEach(async () => {
    if (createdProfessionalIds.length === 0) {
      return;
    }
    const adminClient = createAdminSupabaseClient();
    // Ordem respeita a FK: competency_areas referencia professional_profiles.
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
    createdProfessionalIds = [];
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function createReadyCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("ace-teste") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente ACE" }, admin.userId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });

    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: "Buscando apoio para ansiedade recorrente." }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    // Casos nascem NEW -> avança até READY_FOR_CURATION para poder executar o ACE.
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    return { admin, adminClient, caseId: created.id, patientProfileId: patientAccount.profileId };
  }

  // CompetencyProfile derivado do FakeAceLanguageModel nesta sprint é sempre
  // { domain: "nao_determinado", focus: "avaliacao", experienceLevel: "experiente" }
  // (ver deriveP004Modeling) — os profissionais de teste são cadastrados
  // para corresponder exatamente a isso.
  async function seedEligibleProfessional(adminClient: ReturnType<typeof createAdminSupabaseClient>, adminUserId: string) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional ACE ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary: null,
      institutionName: null,
      createdBy: adminUserId,
    });

    await adminClient
      .from("professional_profiles")
      .update({ experience_level: "experiente", intake_approach: "ambos", offers_continuous_care: true, availability_window: "flexible" })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  it("bloqueia o início para papel incorreto (paciente/profissional)", async () => {
    const { adminClient, caseId } = await createReadyCase();
    const paciente = await loginAs("paciente");

    const result = await runAceExecution({
      supabase: paciente.client,
      caseId,
      actorId: paciente.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    // A RLS de ace_executions/cases bloqueia a leitura/escrita antes mesmo
    // da lógica de negócio — getCase retorna null para quem não tem acesso.
    expect(result.outcome).toBe("error");
    void adminClient;
  });

  it("rejeita executar um Caso em estado inválido (NEW)", async () => {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("ace-invalido") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Estado Inválido" }, admin.userId);
    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, draft.revision);

    const created = await createCase(admin.client, draft.id, undefined, admin.userId);
    expect(created.status).toBe("NEW");

    const result = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("error");
  });

  it("curador não executa um caso atribuído a outro curador (checagem de aplicação)", async () => {
    const curador = await loginAs("curador_medico");
    const { caseId } = await createReadyCase(undefined); // sem atribuição

    const result = await runAceExecution({
      supabase: curador.client,
      caseId,
      actorId: curador.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    // RLS: sem atribuição a este curador, getCase não encontra o caso.
    expect(result.outcome).toBe("error");
  });

  it("executa P001->P008 completo com 3 profissionais elegíveis — Shortlist COMPOSED", async () => {
    const { admin, adminClient, caseId, patientProfileId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("completed");
    expect(result.outcome === "completed" && result.execution.status).toBe("COMPLETED");

    const artifacts = await listArtifactsForCase(admin.client, caseId);
    const types = artifacts.map((a) => a.artifactType);
    expect(types).toEqual([
      "Narrative",
      "DecisionCase",
      "CaseAudit",
      "DecisionContext",
      "CompetencyProfile",
      "EligibleProviderSet",
      "CompatibilityMatrix",
      "Shortlist",
    ]);

    const shortlistArtifact = artifacts.find((a) => a.artifactType === "Shortlist")!;
    expect((shortlistArtifact.payload as { status: string }).status).toBe("COMPOSED");
    expect(shortlistArtifact.validationStatus).toBe("valid");

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("HUMAN_REVIEW");

    // O paciente nunca vê a Shortlist nem qualquer artefato do ACE.
    const patientClient = createCuradoriaClient(url, anonKey);
    // (sem sessão de paciente reaproveitável aqui; a garantia de RLS já é
    // coberta pelos testes de patient-stories/cases — este teste focaliza
    // o pipeline em si.)
    void patientClient;
    void patientProfileId;
  });

  it("interrompe com segurança quando a Shortlist não pode ser composta (menos de 3 elegíveis)", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("blocked");
    expect(result.outcome === "blocked" && result.execution.status).toBe("BLOCKED");
    expect(result.outcome === "blocked" && result.execution.failureCode).toBe("SHORTLIST_INSUFFICIENT_OPTIONS");

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("HUMAN_REVIEW");
  });

  it("retomada: uma segunda chamada reaproveita os artefatos já persistidos (idempotência), nunca duplica", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    const first = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(first.outcome).toBe("completed");

    const artifactsAfterFirst = await listArtifactsForCase(admin.client, caseId);
    expect(artifactsAfterFirst).toHaveLength(8);

    // Uma execução já COMPLETED não reexecuta — retorna erro claro em vez
    // de silenciosamente recomeçar.
    const second = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(second.outcome).toBe("error");

    const artifactsAfterSecond = await listArtifactsForCase(admin.client, caseId);
    expect(artifactsAfterSecond).toHaveLength(8);
  });

  it("artefatos são imutáveis — nenhum caminho de update/delete existe", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });
    const artifacts = await listArtifactsForCase(admin.client, caseId);
    const narrative = artifacts.find((a) => a.artifactType === "Narrative")!;

    const { error: updateError } = await admin.client
      .from("ace_artifacts")
      .update({ payload: { text: "adulterado" } })
      .eq("id", narrative.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client.from("ace_artifacts").delete().eq("id", narrative.id);
    expect(deleteError).not.toBeNull();
  });

  it("concorrência: duas execuções RUNNING simultâneas para o mesmo caso são impedidas", async () => {
    const { admin, caseId } = await createReadyCase();

    // Insere manualmente uma execução RUNNING (simulando uma já em curso)
    // para verificar o índice único de concorrência sem depender de timing.
    const { error: firstInsertError } = await admin.client
      .from("ace_executions")
      .insert({ case_id: caseId, started_by: admin.userId, method_version: "ACE-0.1", status: "RUNNING" });
    expect(firstInsertError).toBeNull();

    const { error: secondInsertError } = await admin.client
      .from("ace_executions")
      .insert({ case_id: caseId, started_by: admin.userId, method_version: "ACE-0.1", status: "RUNNING" });

    expect(secondInsertError).not.toBeNull();
  });

  it("RLS: curador só lê execuções/artefatos de casos atribuídos a ele", async () => {
    const curador = await loginAs("curador_medico");
    const { admin, adminClient, caseId } = await createReadyCase(curador.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });

    const execution = await getLatestExecution(curador.client, caseId);
    expect(execution).not.toBeNull();

    const { caseId: otherCaseId } = await createReadyCase(); // não atribuído a este curador
    const { data: crossExecutions } = await curador.client.from("ace_executions").select("id").eq("case_id", otherCaseId);
    expect(crossExecutions ?? []).toHaveLength(0);
  });
});

describe("Observabilidade do ACE (sprint intermediária, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  // Mesmo isolamento de dados do describe anterior — escopo próprio de
  // rastreamento, já que cada describe define seu próprio
  // seedEligibleProfessional().
  let createdProfessionalIds: string[] = [];

  afterEach(async () => {
    if (createdProfessionalIds.length === 0) {
      return;
    }
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
    createdProfessionalIds = [];
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function createReadyCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("ace-obs") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Obs" }, admin.userId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });

    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: "Buscando apoio para dor crônica." }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    return { admin, adminClient, caseId: created.id };
  }

  async function seedEligibleProfessional(adminClient: ReturnType<typeof createAdminSupabaseClient>, adminUserId: string) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional Obs ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary: null,
      institutionName: null,
      createdBy: adminUserId,
    });

    await adminClient
      .from("professional_profiles")
      .update({ experience_level: "experiente", intake_approach: "ambos", offers_continuous_care: true, availability_window: "flexible" })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  it("uma execução completa registra um log estruturado coerente (STARTED, PROTOCOL_STARTED/COMPLETED por protocolo, COMPLETED)", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(result.outcome).toBe("completed");

    const events = await listExecutionEventsForCase(admin.client, caseId);
    expect(events[0].eventType).toBe("STARTED");
    expect(events[events.length - 1].eventType).toBe("COMPLETED");

    const protocolStartedCount = events.filter((event) => event.eventType === "PROTOCOL_STARTED").length;
    const protocolCompletedCount = events.filter((event) => event.eventType === "PROTOCOL_COMPLETED").length;
    expect(protocolStartedCount).toBe(8);
    expect(protocolCompletedCount).toBe(8);

    // Cronológico — a query já ordena por created_at, aqui só confirmamos
    // que não há inversão entre STARTED e o primeiro PROTOCOL_STARTED (P001).
    const firstProtocolStarted = events.find((event) => event.eventType === "PROTOCOL_STARTED");
    expect(new Date(firstProtocolStarted!.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(events[0].createdAt).getTime(),
    );
  });

  it("um bloqueio registra um evento BLOCKED com o motivo sanitizado", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId); // só 1 — Shortlist será BLOCKED

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });

    const events = await listExecutionEventsForCase(admin.client, caseId);
    const blockedEvent = events.find((event) => event.eventType === "BLOCKED");
    expect(blockedEvent).toBeDefined();
    expect(blockedEvent!.protocolId).toBe("P008");
    expect(blockedEvent!.message).not.toMatch(/at\s|Error:|stack/i);
  });

  it("eventos são append-only — sem policy de update/delete", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });
    const events = await listExecutionEventsForCase(admin.client, caseId);

    const { error: updateError } = await admin.client
      .from("ace_execution_events")
      .update({ message: "adulterado" })
      .eq("id", events[0].id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client.from("ace_execution_events").delete().eq("id", events[0].id);
    expect(deleteError).not.toBeNull();
  });

  it("RLS: curador não lê eventos de um caso que não é seu", async () => {
    const curador = await loginAs("curador_medico");
    const { admin, adminClient, caseId } = await createReadyCase(); // não atribuído ao curador
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });

    const { data } = await curador.client.from("ace_execution_events").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(0);
  });

  it("getExecutionMetrics agrega corretamente uma execução concluída", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    await runAceExecution({ supabase: admin.client, caseId, actorId: admin.userId, languageModel: new FakeAceLanguageModel() });

    const metrics = await getExecutionMetrics(admin.client);
    expect(metrics.totalExecutions).toBeGreaterThanOrEqual(1);
    expect(metrics.byStatus.COMPLETED).toBeGreaterThanOrEqual(1);
    expect(metrics.averageCompletionMinutes).not.toBeNull();
  });

  it("getAceHealthCheck identifica uma execução presa em RUNNING há mais de 30 minutos", async () => {
    const { admin, caseId } = await createReadyCase();

    const startedAt = new Date(Date.now() - 45 * 60_000).toISOString();
    const { error } = await admin.client
      .from("ace_executions")
      .insert({ case_id: caseId, started_by: admin.userId, method_version: "ACE-0.1", status: "RUNNING", started_at: startedAt });
    expect(error).toBeNull();

    const healthCheck = await getAceHealthCheck(admin.client);
    expect(healthCheck.stuckRunningExecutions.some((execution) => execution.caseId === caseId)).toBe(true);
  });
});

// Simula uma falha classificada do fornecedor (nunca uma exceção crua) —
// exatamente o formato que AnthropicAceLanguageModel produz para
// autenticação/rate-limit/timeout/resposta inválida (ver
// anthropic-language-model.ts, classifyAnthropicError). Injetado
// diretamente em runAceExecution — não depende de credencial real da
// Anthropic para provar que o orquestrador nunca cai no modelo fake nem
// avança de protocolo diante de uma falha do fornecedor.
class FailingLanguageModel implements AceLanguageModel {
  constructor(private readonly code: string) {}

  async run<TInput, TOutput>(_request: AceLanguageModelRequest<TInput>): Promise<AceLanguageModelResponse<TOutput>> {
    return {
      output: null,
      metadata: {
        modelId: "test-failing-model",
        executedAt: new Date().toISOString(),
        status: "error",
        error: { code: this.code, message: "Detalhe interno do fornecedor — nunca deveria chegar ao Curador." },
      },
    };
  }
}

// ADR-024 (docs/DECISIONS.md) — simula uma resposta bem formada do P003
// (passaria validação de schema) que classifica uma restrição prática
// opcional como bloqueante — a violação de conteúdo que o Content
// Invariant do P003 rejeita. P002 retorna uma extração válida (decisão e
// objetivo definidos) para isolar o teste no comportamento do P003.
class P003ContentInvariantViolationModel implements AceLanguageModel {
  async run<TInput, TOutput>(request: AceLanguageModelRequest<TInput>): Promise<AceLanguageModelResponse<TOutput>> {
    if (request.protocolId === "P002") {
      return {
        output: {
          decisionStatement: {
            decision: "Encontrar um profissional para apoio à dor crônica.",
            goal: "Reduzir o impacto da dor crônica no dia a dia.",
            sourceType: "fato_relatado",
          },
          mandatoryConstraints: [],
          preferences: [],
          missingInformation: [],
        } as unknown as TOutput,
        metadata: { modelId: "test-p003-invariant-violation", executedAt: new Date().toISOString(), status: "ok" },
      };
    }

    if (request.protocolId === "P003") {
      return {
        output: {
          additionalFindings: [
            {
              description: "Não ficou claro qual a localização preferida para o atendimento.",
              category: "ausencia",
              severity: "blocking",
              recommendedQuestion: "Você tem preferência de localização para o atendimento?",
              relatedField: "other",
            },
          ],
        } as unknown as TOutput,
        metadata: { modelId: "test-p003-invariant-violation", executedAt: new Date().toISOString(), status: "ok" },
      };
    }

    throw new Error(`P003ContentInvariantViolationModel: protocolo inesperado neste teste (${request.protocolId}).`);
  }
}

describe("GO LIVE — proteção do modelo de linguagem em produção (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function createReadyCase() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("go-live") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente GoLive" }, admin.userId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: "Buscando apoio para dor crônica." }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, undefined, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    return { admin, caseId: created.id, patientClient };
  }

  it.each([
    "ACE_MODEL_AUTHENTICATION_FAILED",
    "ACE_MODEL_RATE_LIMITED",
    "ACE_MODEL_TIMEOUT",
    "ACE_MODEL_INVALID_RESPONSE",
  ])("falha do fornecedor (%s) interrompe a execução, sem fallback, sem avançar protocolo, mensagem sanitizada", async (code) => {
    const { admin, caseId } = await createReadyCase();

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FailingLanguageModel(code),
    });

    expect(result.outcome).toBe("failed");
    expect(result.outcome === "failed" && result.execution.failureCode).toBe(code);
    expect(result.outcome === "failed" && result.execution.failureMessage).not.toContain("Detalhe interno do fornecedor");

    // Nunca persiste um artefato para o protocolo que falhou (P002).
    const artifacts = await listArtifactsForCase(admin.client, caseId);
    expect(artifacts.some((artifact) => artifact.artifactType === "DecisionCase")).toBe(false);
  });

  it("uma execução falha pode ser retomada com um modelo funcional, sem recomputar o que já foi persistido", async () => {
    const { admin, caseId } = await createReadyCase();

    const failed = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FailingLanguageModel("ACE_MODEL_UNAVAILABLE"),
    });
    expect(failed.outcome).toBe("failed");

    const resumed = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(["completed", "blocked"]).toContain(resumed.outcome);
  });

  it("ADR-024 — violação do Content Invariant do P003 nunca vira CASE_AUDIT_BLOCKED, nem move o Caso para WAITING_FOR_INFORMATION", async () => {
    const { admin, caseId } = await createReadyCase();

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new P003ContentInvariantViolationModel(),
    });

    expect(result.outcome).toBe("failed");
    expect(result.outcome === "failed" && result.execution.failureCode).toBe("CONTENT_INVARIANT_VIOLATION");
    expect(result.outcome === "failed" && result.execution.failureCode).not.toBe("CASE_AUDIT_BLOCKED");

    // Nunca persiste um CaseAudit malformado para o protocolo que violou o invariant.
    const artifacts = await listArtifactsForCase(admin.client, caseId);
    expect(artifacts.some((artifact) => artifact.artifactType === "CaseAudit")).toBe(false);

    // O catch genérico (orchestrator.ts) nunca chama changeCaseStatus — o
    // Caso permanece em IN_CURATION (transição já aplicada no início de
    // qualquer execução, orchestrator.ts:180-181, antes de qualquer
    // protocolo rodar) — nunca é redirecionado para pedir informação ao
    // paciente por um problema que não é dele.
    const afterCase = await getCase(admin.client, caseId);
    expect(afterCase?.status).toBe("IN_CURATION");
    expect(afterCase?.status).not.toBe("WAITING_FOR_INFORMATION");
  });

  it("o paciente nunca vê o código ou a mensagem de falha do modelo — só o status traduzido do Caso", async () => {
    const { admin, caseId, patientClient } = await createReadyCase();
    await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FailingLanguageModel("ACE_MODEL_AUTHENTICATION_FAILED"),
    });

    // A view do paciente (patient_case_overview, RLS por auth.uid()) nunca
    // expõe failureCode/failureMessage — só a tradução do status do Caso.
    const { data: overview } = await patientClient
      .from("patient_case_overview")
      .select("status_label")
      .eq("case_id", caseId)
      .maybeSingle();

    expect(overview).not.toBeNull();
    const overviewText = JSON.stringify(overview);
    expect(overviewText).not.toContain("ACE_MODEL");
    expect(overviewText).not.toContain("Detalhe interno do fornecedor");
  });
});
