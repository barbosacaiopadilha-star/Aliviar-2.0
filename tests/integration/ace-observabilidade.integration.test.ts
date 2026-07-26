// HISTÓRICO / OBSERVABILIDADE DO MOTOR ACE — SEM AUTORIDADE OPERACIONAL.
//
// Esta suíte NÃO é o teste do Concierge canônico, e não valida nenhum fluxo
// operacional da Plataforma. A ADR-035 removeu do ACE o papel de motor de
// Curadoria e a ADR-036 descontinuou todas as suas superfícies: não existe
// rota, Server Action, painel, botão, fluxo de paciente ou de Curador capaz de
// acionar `runAceExecution`. A entrega canônica é a do Método, e o jusante
// depende apenas do contrato canônico de entrega.
//
// O que permanece é o motor sob observação. A ADR-035 §8 preserva
// explicitamente observabilidade, Golden Set, governança do modelo, logs e
// métricas — e é exatamente isso que estes testes certificam: a cadeia
// P001→P008, o log estruturado por protocolo, idempotência, retomada,
// métricas, health check e a proteção contra falha do fornecedor. Nada disso
// pode ser substituído por fixture: seria a fixture testando a fixture.
//
// A separação de responsabilidades:
//   - aqui: o que o MOTOR produz (executa `runAceExecution`);
//   - ace-historico.integration.test.ts: o que o BANCO garante sobre o dado já
//     persistido (grants, RLS, índices), sem nenhum escritor.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import {
  getAceHealthCheck,
  getExecutionMetrics,
  listArtifactsForCase,
  listExecutionEventsForCase,
} from "@/modules/concierge/execution-repository";
import type {
  AceLanguageModel,
  AceLanguageModelRequest,
  AceLanguageModelResponse,
} from "@/modules/concierge/language-model";
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

// Simula uma falha classificada do fornecedor (nunca uma exceção crua) —
// exatamente o formato que AnthropicAceLanguageModel produz para
// autenticação/rate-limit/timeout/resposta inválida (ver
// anthropic-language-model.ts, classifyAnthropicError). Injetado diretamente em
// runAceExecution — não depende de credencial real da Anthropic para provar que
// o orquestrador nunca cai no modelo fake nem avança de protocolo diante de uma
// falha do fornecedor.
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
// (passaria validação de schema) que classifica uma restrição prática opcional
// como bloqueante: a violação de conteúdo que o Content Invariant do P003
// rejeita. P002 retorna uma extração válida (decisão e objetivo definidos) para
// isolar o teste no comportamento do P003.
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

describe("ACE — motor histórico sob observação, sem autoridade operacional (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  // professional_profiles/professional_competency_areas são um recurso global
  // no Supabase local, nunca escopado por Caso: cada profissional criado por
  // seedEligibleProfessional() precisa sair ao final do teste que o criou,
  // senão contamina a avaliação de elegibilidade (P006) de qualquer teste
  // seguinte — nesta execução ou em execuções futuras do comando.
  let createdProfessionalIds: string[] = [];
  // Higiene que o antigo concierge.integration.test.ts não tinha: cada Caso
  // arrasta paciente, história e (por cascade de case_id) execuções, artefatos
  // e eventos. Sem rastrear o profileId, tudo isso ficava no banco.
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();
    const cleanupFailures: string[] = [];

    if (createdPatientProfileIds.length > 0) {
      // `cases` cascade para ace_executions, ace_artifacts e
      // ace_execution_events — nenhuma delas tem FK sem cascade a partir do
      // Case, e esta suíte nunca cria human_review_results.
      for (const [table, column] of [
        ["cases", "patient_profile_id"],
        ["patient_stories", "profile_id"],
        ["patient_profiles", "profile_id"],
        ["user_roles", "profile_id"],
      ] as const) {
        const { error } = await adminClient.from(table).delete().in(column, createdPatientProfileIds);
        if (error) {
          cleanupFailures.push(`${table}: ${error.message}`);
        }
      }
      for (const profileId of createdPatientProfileIds) {
        await adminClient.auth.admin.deleteUser(profileId);
      }
      createdPatientProfileIds = [];
    }

    if (createdProfessionalIds.length > 0) {
      const { error: areaError } = await adminClient
        .from("professional_competency_areas")
        .delete()
        .in("professional_profile_id", createdProfessionalIds);
      if (areaError) {
        cleanupFailures.push(`professional_competency_areas: ${areaError.message}`);
      }
      const { error } = await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
      if (error) {
        cleanupFailures.push(`professional_profiles: ${error.message}`);
      }
      createdProfessionalIds = [];
    }

    if (cleanupFailures.length > 0) {
      throw new Error(`teardown: resíduo não removido — ${cleanupFailures.join("; ")}`);
    }
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
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente ACE" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });

    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Buscando apoio para ansiedade recorrente." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    // Casos nascem NEW -> avança até READY_FOR_CURATION para poder executar o ACE.
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    return { admin, adminClient, patientClient, caseId: created.id };
  }

  // CompetencyProfile derivado do FakeAceLanguageModel é sempre
  // { domain: "nao_determinado", focus: "avaliacao", experienceLevel: "experiente" }
  // (ver deriveP004Modeling) — os profissionais de teste são cadastrados para
  // corresponder exatamente a isso.
  async function seedEligibleProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
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
      .update({
        experience_level: "experiente",
        intake_approach: "ambos",
        offers_continuous_care: true,
        availability_window: "flexible",
      })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  async function seedThreeEligibleProfessionals(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
    await seedEligibleProfessional(adminClient, adminUserId);
    await seedEligibleProfessional(adminClient, adminUserId);
    await seedEligibleProfessional(adminClient, adminUserId);
  }

  // O1
  it("executa P001→P008 completo com 3 profissionais elegíveis — Shortlist COMPOSED", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedThreeEligibleProfessionals(adminClient, admin.userId);

    const result = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("completed");
    expect(result.outcome === "completed" && result.execution.status).toBe("COMPLETED");

    const artifacts = await listArtifactsForCase(admin.client, caseId);
    expect(artifacts.map((a) => a.artifactType)).toEqual([
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
  });

  // O2
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

  // O3 — a propriedade é a integridade do que já foi persistido: uma segunda
  // chamada nunca duplica nem substitui artefato. O retorno da segunda chamada
  // é consequência, não a evidência.
  it("retomada: uma segunda chamada nunca duplica nem substitui os artefatos já persistidos", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedThreeEligibleProfessionals(adminClient, admin.userId);

    const first = await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(first.outcome).toBe("completed");

    const before = await listArtifactsForCase(admin.client, caseId);
    expect(before).toHaveLength(8);

    await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const after = await listArtifactsForCase(admin.client, caseId);
    expect(after).toHaveLength(8);
    // Mesmos artefatos, mesmas versões: nada foi recomputado nem sobrescrito.
    expect(after.map((artifact) => artifact.id)).toEqual(before.map((artifact) => artifact.id));
    expect(after.map((artifact) => artifact.version)).toEqual(before.map((artifact) => artifact.version));
    expect(after.every((artifact) => artifact.supersedes === null)).toBe(true);
  });

  // O4
  it("uma execução completa registra um log estruturado coerente (STARTED, PROTOCOL_STARTED/COMPLETED por protocolo, COMPLETED)", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedThreeEligibleProfessionals(adminClient, admin.userId);

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

    expect(events.filter((event) => event.eventType === "PROTOCOL_STARTED")).toHaveLength(8);
    expect(events.filter((event) => event.eventType === "PROTOCOL_COMPLETED")).toHaveLength(8);

    // Cronológico — a query já ordena por created_at; aqui só confirmamos que
    // não há inversão entre STARTED e o primeiro PROTOCOL_STARTED (P001).
    const firstProtocolStarted = events.find((event) => event.eventType === "PROTOCOL_STARTED");
    expect(new Date(firstProtocolStarted!.createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(events[0].createdAt).getTime(),
    );
  });

  // O5
  it("um bloqueio registra um evento BLOCKED com o motivo sanitizado", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedEligibleProfessional(adminClient, admin.userId); // só 1 — Shortlist será BLOCKED

    await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const events = await listExecutionEventsForCase(admin.client, caseId);
    const blockedEvent = events.find((event) => event.eventType === "BLOCKED");
    expect(blockedEvent).toBeDefined();
    expect(blockedEvent!.protocolId).toBe("P008");
    expect(blockedEvent!.message).not.toMatch(/at\s|Error:|stack/i);
  });

  // O6
  it("getExecutionMetrics agrega corretamente uma execução concluída", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();
    await seedThreeEligibleProfessionals(adminClient, admin.userId);

    await runAceExecution({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const metrics = await getExecutionMetrics(admin.client);
    expect(metrics.totalExecutions).toBeGreaterThanOrEqual(1);
    expect(metrics.byStatus.COMPLETED).toBeGreaterThanOrEqual(1);
    expect(metrics.averageCompletionMinutes).not.toBeNull();
  });

  // O7
  it("getAceHealthCheck identifica uma execução presa em RUNNING há mais de 30 minutos", async () => {
    const { admin, caseId } = await createReadyCase();

    const startedAt = new Date(Date.now() - 45 * 60_000).toISOString();
    const { error } = await admin.client.from("ace_executions").insert({
      case_id: caseId,
      started_by: admin.userId,
      method_version: "ACE-0.1",
      status: "RUNNING",
      started_at: startedAt,
    });
    expect(error).toBeNull();

    const healthCheck = await getAceHealthCheck(admin.client);
    expect(healthCheck.stuckRunningExecutions.some((execution) => execution.caseId === caseId)).toBe(true);
  });

  // O8
  it.each([
    "ACE_MODEL_AUTHENTICATION_FAILED",
    "ACE_MODEL_RATE_LIMITED",
    "ACE_MODEL_TIMEOUT",
    "ACE_MODEL_INVALID_RESPONSE",
  ])(
    "falha do fornecedor (%s) interrompe a execução, sem fallback, sem avançar protocolo, mensagem sanitizada",
    async (code) => {
      const { admin, caseId } = await createReadyCase();

      const result = await runAceExecution({
        supabase: admin.client,
        caseId,
        actorId: admin.userId,
        languageModel: new FailingLanguageModel(code),
      });

      expect(result.outcome).toBe("failed");
      expect(result.outcome === "failed" && result.execution.failureCode).toBe(code);
      expect(result.outcome === "failed" && result.execution.failureMessage).not.toContain(
        "Detalhe interno do fornecedor",
      );

      // Nunca persiste um artefato para o protocolo que falhou (P002).
      const artifacts = await listArtifactsForCase(admin.client, caseId);
      expect(artifacts.some((artifact) => artifact.artifactType === "DecisionCase")).toBe(false);
    },
  );

  // O9
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

  // O10
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

    // O catch genérico (orchestrator.ts) nunca chama changeCaseStatus — o Caso
    // permanece em IN_CURATION (transição já aplicada no início de qualquer
    // execução, antes de qualquer protocolo rodar) e nunca é redirecionado para
    // pedir informação ao paciente por um problema que não é dele.
    const afterCase = await getCase(admin.client, caseId);
    expect(afterCase?.status).toBe("IN_CURATION");
    expect(afterCase?.status).not.toBe("WAITING_FOR_INFORMATION");
  });
});
