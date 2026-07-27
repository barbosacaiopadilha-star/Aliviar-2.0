// HISTÓRICO / OBSERVABILIDADE — dado persistido do ACE (execuções, eventos,
// artefatos).
//
// Esta suíte NÃO valida o fluxo operacional atual. A ADR-035 removeu do ACE o
// papel de motor de Curadoria e a ADR-036 descontinuou as superfícies que o
// acionavam. O que permanece — e o que estes testes observam — é o dado
// histórico já persistido e as garantias do PRÓPRIO BANCO sobre ele: grants,
// policies de RLS e índices. Nenhuma asserção aqui depende do motor.
//
// Por isso nada aqui chama `runAceExecution`, `submitHumanReview`,
// `deliverFinalCuradoria` ou `FakeAceLanguageModel`. O estado histórico é
// inserido diretamente pela fixture — ver
// tests/integration/legacy-ace-chain-fixture.ts. As propriedades do motor em
// si (cadeia P001→P008, log estruturado, métricas, health, governança do
// modelo) vivem em ace-observabilidade.integration.test.ts, que continua
// executando o motor histórico.
//
// OBSOLETO PELA ADR-036 — três cenários do antigo concierge.integration.test.ts
// não foram migrados, porque sua única evidência era o retorno de
// `runAceExecution` como guard de autorização/estado:
//   - "bloqueia o início para papel incorreto (paciente/profissional)";
//   - "rejeita executar um Caso em estado inválido (NEW)";
//   - "curador não executa um caso atribuído a outro curador".
// A RLS que os sustentava continua coberta aqui (H3, H5) e em
// cases.integration.test.ts. Sem ponto de entrada na aplicação, não há fluxo
// operacional a proteger.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { getLatestExecution, listArtifactsForCase } from "@/modules/concierge/execution-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import {
  cleanupLegacyAceChain,
  seedLegacyAceExecution,
  seedLegacyHumanReview,
  type LegacyAceChainFixture,
} from "./legacy-ace-chain-fixture";

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

describe("ACE — HISTÓRICO / OBSERVABILIDADE do dado persistido (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  let createdPatientProfileIds: string[] = [];
  let createdProfessionalIds: string[] = [];
  // A cadeia histórica sai explicitamente, nunca por cascade: as FKs de
  // human_review_results para execução e artefatos não têm `on delete cascade`.
  let createdFixtures: LegacyAceChainFixture[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();
    const cleanupFailures: string[] = [];

    for (const fixture of createdFixtures) {
      try {
        await cleanupLegacyAceChain(adminClient, fixture);
      } catch (error) {
        cleanupFailures.push((error as Error).message);
      }
    }
    createdFixtures = [];

    // Pacientes e Cases primeiro, profissionais depois: enquanto o Case vive,
    // FKs em tabelas derivadas impedem a remoção do profissional.
    if (createdPatientProfileIds.length > 0) {
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

  async function seedEligibleProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
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

  // Caso real pronto para curadoria, com paciente real — o ponto de partida de
  // qualquer estado histórico. Nenhum protocolo do ACE roda aqui.
  async function createReadyCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("ace-hist") + "@aliviar-conexao.local";
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
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    return { admin, adminClient, patientClient, caseId: created.id, patientProfileId: patientAccount.profileId };
  }

  // Caso histórico com execução, os dois artefatos e uma decisão VALIDATED.
  async function createCaseWithHistoricalChain(assignCuratorId?: string) {
    const ready = await createReadyCase(assignCuratorId);
    const providerProfileIds = [
      await seedEligibleProfessional(ready.adminClient, ready.admin.userId),
      await seedEligibleProfessional(ready.adminClient, ready.admin.userId),
      await seedEligibleProfessional(ready.adminClient, ready.admin.userId),
    ];

    const fixture = await seedLegacyHumanReview({
      service: ready.adminClient,
      caseId: ready.caseId,
      actorId: ready.admin.userId,
      providerProfileIds,
    });
    createdFixtures.push(fixture);

    return { ...ready, fixture };
  }

  // H1
  it("artefatos históricos são imutáveis — nenhum caminho de update/delete existe", async () => {
    const { admin, caseId } = await createCaseWithHistoricalChain();

    const artifacts = await listArtifactsForCase(admin.client, caseId);
    expect(artifacts.map((artifact) => artifact.artifactType).sort()).toEqual(["CompatibilityMatrix", "Shortlist"]);

    const target = artifacts[0];

    const { error: updateError } = await admin.client
      .from("ace_artifacts")
      .update({ payload: { text: "adulterado" } })
      .eq("id", target.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client.from("ace_artifacts").delete().eq("id", target.id);
    expect(deleteError).not.toBeNull();
  });

  // H2 — o índice parcial `ace_executions_one_running_per_case_idx`, exercido
  // direto contra o banco. Nunca pelo orquestrador.
  it("duas execuções RUNNING simultâneas para o mesmo Caso são impedidas pelo índice parcial", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();

    const fixture = await seedLegacyAceExecution({
      service: adminClient,
      caseId,
      actorId: admin.userId,
      status: "RUNNING",
      currentProtocol: "P001",
      finishedAt: null,
    });
    createdFixtures.push(fixture);

    const { error: secondInsertError } = await admin.client
      .from("ace_executions")
      .insert({ case_id: caseId, started_by: admin.userId, method_version: "ACE-0.1", status: "RUNNING" });

    expect(secondInsertError).not.toBeNull();
    expect(secondInsertError!.code).toBe("23505");

    // Continua existindo exatamente uma execução para o Caso.
    const { data: rows } = await adminClient.from("ace_executions").select("id").eq("case_id", caseId);
    expect(rows ?? []).toHaveLength(1);
    expect(rows![0]!.id).toBe(fixture.executionId);
  });

  // H3
  it("RLS: curador só lê execuções e artefatos de casos atribuídos a ele", async () => {
    const curador = await loginAs("curador_medico");
    const proprio = await createCaseWithHistoricalChain(curador.userId);

    const execution = await getLatestExecution(curador.client, proprio.caseId);
    expect(execution?.id).toBe(proprio.fixture.executionId);

    const artifacts = await listArtifactsForCase(curador.client, proprio.caseId);
    expect(artifacts).toHaveLength(2);

    const alheio = await createCaseWithHistoricalChain(); // não atribuído a este curador
    const { data: crossExecutions } = await curador.client
      .from("ace_executions")
      .select("id")
      .eq("case_id", alheio.caseId);
    expect(crossExecutions ?? []).toHaveLength(0);

    const { data: crossArtifacts } = await curador.client
      .from("ace_artifacts")
      .select("id")
      .eq("case_id", alheio.caseId);
    expect(crossArtifacts ?? []).toHaveLength(0);
  });

  // H4
  it("eventos históricos são append-only — sem caminho de update/delete", async () => {
    const { admin, adminClient, caseId } = await createReadyCase();

    const fixture = await seedLegacyAceExecution({
      service: adminClient,
      caseId,
      actorId: admin.userId,
      status: "COMPLETED",
      currentProtocol: "P008",
      events: [
        { eventType: "STARTED", message: "Execução iniciada." },
        { eventType: "PROTOCOL_COMPLETED", protocolId: "P008", message: "Shortlist composta." },
        { eventType: "COMPLETED", message: "Execução concluída." },
      ],
    });
    createdFixtures.push(fixture);
    expect(fixture.executionEventIds).toHaveLength(3);

    const { error: updateError } = await admin.client
      .from("ace_execution_events")
      .update({ message: "adulterado" })
      .eq("id", fixture.executionEventIds[0]);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client
      .from("ace_execution_events")
      .delete()
      .eq("id", fixture.executionEventIds[0]);
    expect(deleteError).not.toBeNull();
  });

  // H5
  it("RLS: curador não lê eventos de um Caso alheio; lê os do Caso atribuído a ele", async () => {
    const curador = await loginAs("curador_medico");

    const alheio = await createReadyCase(); // não atribuído ao curador
    createdFixtures.push(
      await seedLegacyAceExecution({
        service: alheio.adminClient,
        caseId: alheio.caseId,
        actorId: alheio.admin.userId,
        status: "COMPLETED",
        currentProtocol: "P008",
        events: [{ eventType: "COMPLETED", message: "Execução concluída." }],
      }),
    );

    const { data: semVinculo } = await curador.client
      .from("ace_execution_events")
      .select("id")
      .eq("case_id", alheio.caseId);
    expect(semVinculo ?? []).toHaveLength(0);

    const proprio = await createReadyCase(curador.userId);
    const proprioFixture = await seedLegacyAceExecution({
      service: proprio.adminClient,
      caseId: proprio.caseId,
      actorId: proprio.admin.userId,
      status: "COMPLETED",
      currentProtocol: "P008",
      events: [{ eventType: "COMPLETED", message: "Execução concluída." }],
    });
    createdFixtures.push(proprioFixture);

    const { data: comVinculo } = await curador.client
      .from("ace_execution_events")
      .select("id")
      .eq("case_id", proprio.caseId);
    expect(comVinculo ?? []).toHaveLength(1);
    expect(comVinculo![0]!.id).toBe(proprioFixture.executionEventIds[0]);
  });

  // H6 — a falha do fornecedor persistida existe para a equipe, nunca para o
  // paciente. A garantia é da view (patient_case_overview não projeta
  // failure_code/failure_message) somada à RLS por auth.uid() — não do
  // orquestrador.
  it("o paciente nunca vê failure_code nem failure_message — só o status traduzido do Caso", async () => {
    const { admin, adminClient, patientClient, caseId } = await createReadyCase();

    // Uma execução falha deixava o Caso em IN_CURATION: a transição acontece no
    // início de qualquer execução, antes de qualquer protocolo rodar.
    await changeCaseStatus(admin.client, caseId, "IN_CURATION", admin.userId);

    const fixture = await seedLegacyAceExecution({
      service: adminClient,
      caseId,
      actorId: admin.userId,
      status: "FAILED",
      currentProtocol: "P002",
      failureCode: "ACE_MODEL_AUTHENTICATION_FAILED",
      failureMessage: "Detalhe interno do fornecedor — nunca deveria chegar ao paciente.",
      events: [{ eventType: "FAILED", protocolId: "P002", message: "Execução interrompida por falha do modelo." }],
    });
    createdFixtures.push(fixture);

    // A equipe enxerga o diagnóstico técnico...
    const execution = await getLatestExecution(admin.client, caseId);
    expect(execution?.failureCode).toBe("ACE_MODEL_AUTHENTICATION_FAILED");

    // ...e o paciente, apenas a tradução do status.
    const { data: overview } = await patientClient
      .from("patient_case_overview")
      .select("status_label")
      .eq("case_id", caseId)
      .maybeSingle();

    expect(overview).not.toBeNull();
    const overviewText = JSON.stringify(overview);
    expect(overviewText).not.toContain("ACE_MODEL");
    expect(overviewText).not.toContain("Detalhe interno do fornecedor");

    // E nem alcança a tabela de execuções.
    const { data: patientExecutions } = await patientClient.from("ace_executions").select("id").eq("case_id", caseId);
    expect(patientExecutions ?? []).toHaveLength(0);
  });
});
