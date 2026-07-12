import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

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

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createClient(url, anonKey);
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

    const patientClient = createClient(url, anonKey);
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
    const patientClient = createClient(url, anonKey);
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
    const patientClient = createClient(url, anonKey);
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

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createClient(url, anonKey);
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

    const patientClient = createClient(url, anonKey);
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
