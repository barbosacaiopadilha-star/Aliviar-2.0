import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import { deliverFinalCuradoria } from "@/modules/concierge/delivery-repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { submitHumanReview } from "@/modules/concierge/human-review-repository";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import {
  getOrCreateActiveStory,
  saveStoryDraft,
  submitStory,
} from "@/modules/story/repository";

// As Server Actions ("use server") de connection/actions.ts não podem ser
// chamadas fora de uma requisição real do Next.js sem next/headers estar
// disponível — createServerSupabaseClient() lê cookies via next/headers,
// que não existe no runtime do Vitest. Por isso, este arquivo testa a
// camada de repository/RPC diretamente (SupabaseConnectionRepository +
// funções puras de commands.ts, exatamente como uma Server Action real as
// chamaria) para validar persistência, RLS, constraints, triggers e
// concorrência real contra o banco local (Etapa 9: "não simular com mock
// aquilo que só o banco pode garantir"), sem depender do runtime de Server
// Actions do Next.js, que este ambiente de teste não fornece.
import {
  closeWithoutRelationship,
  confirmFirstAppointment,
  correctChoice,
  createConnection,
  registerContactIntent,
} from "@/modules/connection/commands";
import { ConnectionError } from "@/modules/connection/errors";

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

describe("Connection Engine — MVP — PR3 (repository, RPC, RLS — Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  let createdProfessionalIds: string[] = [];
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();

    if (createdProfessionalIds.length > 0) {
      await adminClient
        .from("professional_competency_areas")
        .delete()
        .in("professional_profile_id", createdProfessionalIds);
      await adminClient
        .from("professional_profiles")
        .delete()
        .in("id", createdProfessionalIds);
      createdProfessionalIds = [];
    }

    if (createdPatientProfileIds.length > 0) {
      // cases cascade para connection_records (on delete cascade, PR1) e
      // connection_records cascade para connection_events.
      await adminClient
        .from("cases")
        .delete()
        .in("patient_profile_id", createdPatientProfileIds);
      await adminClient
        .from("patient_stories")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      await adminClient
        .from("patient_profiles")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      await adminClient
        .from("user_roles")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      for (const profileId of createdPatientProfileIds) {
        await adminClient.auth.admin.deleteUser(profileId);
      }
      createdPatientProfileIds = [];
    }
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function seedPresentableProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional Connection ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary:
        "Profissional com experiência em acolhimento e escuta ativa.",
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
        practical_considerations: ["Atende também por telemedicina."],
      })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({
        professional_profile_id: professional.id,
        domain: "nao_determinado",
        focus: "avaliacao",
      });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  // Caso completo, entregue de verdade (P001->P010) — o único ponto de
  // partida real e honesto para testar Connection, já que ele só nasce
  // depois que uma FinalCuradoria existe.
  async function createDeliveredCase() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("connection") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Connection" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({
      email,
      password: patientAccount.password,
    });
    const draft = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Buscando apoio para dor crônica." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(
      admin.client,
      draft.id,
      undefined,
      admin.userId,
    );
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(
      admin.client,
      created.id,
      "READY_FOR_CURATION",
      admin.userId,
    );

    const professionalIds = [
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
    ];

    const execution = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(execution.outcome).toBe("completed");

    const review = await submitHumanReview(admin.client, {
      caseId: created.id,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale:
        "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });
    expect(review.outcome).toBe("recorded");

    const delivery = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(delivery.outcome).toBe("delivered");
    const deliveryRecord =
      delivery.outcome === "delivered" ? delivery.delivery : null;

    return {
      admin,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId: deliveryRecord!.id,
    };
  }

  it("cria um Connection real (RPC create_connection_with_event) e o paciente consegue lê-lo (RLS)", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);

    const now = new Date().toISOString();
    const result = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );

    const created = await repository.create(result.record, result.event);
    expect(created.status).toBe("DECISAO_REGISTRADA");
    expect(created.professionalProfileId).toBe(professionalIds[0]);

    const reread = await repository.findByCaseId(caseId);
    expect(reread?.id).toBe(created.id);

    const events = await repository.listEvents(created.id);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("DECISAO_REGISTRADA");
  });

  it("unicidade por Caso (23505): um segundo create para o mesmo Caso é rejeitado pelo repository", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const first = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    await repository.create(first.record, first.event);

    const second = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[1],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );

    await expect(
      repository.create(second.record, second.event),
    ).rejects.toThrow(ConnectionError);
  });

  it("concorrência real: duas tentativas simultâneas de criar Connection para o mesmo Caso — exatamente uma sucede", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const attempt = () => {
      const result = createConnection(
        {
          caseId,
          finalCuradoriaDeliveryId,
          patientProfileId,
          professionalProfileId: professionalIds[0],
          actorId: patientProfileId,
          occurredAt: now,
          recordedAt: now,
        },
        { eligibleProfessionalProfileIds: professionalIds },
      );
      return repository.create(result.record, result.event);
    };

    const outcomes = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const adminClient = createAdminSupabaseClient();
    const { data } = await adminClient
      .from("connection_records")
      .select("id")
      .eq("case_id", caseId);
    expect(data ?? []).toHaveLength(1);
  });

  it("fluxo feliz completo: DECISAO_REGISTRADA -> CONTATO_INICIADO -> PRIMEIRO_ATENDIMENTO_REALIZADO, via RPC apply_connection_transition", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    const contact = registerContactIntent(record0, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    const record1 = await repository.update(
      record0.status,
      contact.record,
      contact.event,
    );
    expect(record1.status).toBe("CONTATO_INICIADO");

    const confirm = confirmFirstAppointment(record1, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    const record2 = await repository.update(
      record1.status,
      confirm.record,
      confirm.event,
    );
    expect(record2.status).toBe("PRIMEIRO_ATENDIMENTO_REALIZADO");

    const events = await repository.listEvents(record2.id);
    expect(events.map((e) => e.eventType)).toEqual([
      "DECISAO_REGISTRADA",
      "CONTATO_INICIADO",
      "PRIMEIRO_ATENDIMENTO_REALIZADO",
    ]);

    // Estado terminal: uma nova tentativa de transição é rejeitada tanto
    // pelo domínio (TERMINAL_STATE, antes de qualquer chamada ao banco)...
    expect(() =>
      confirmFirstAppointment(record2, {
        requestedByPatientProfileId: patientProfileId,
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      }),
    ).toThrow(ConnectionError);

    // ...quanto pelo próprio trigger do banco (PR1), provado inserindo
    // diretamente contra a tabela, sem passar pelo domínio.
    const adminClient = createAdminSupabaseClient();
    const directUpdate = await adminClient
      .from("connection_records")
      .update({ status: "ENCERRADO_SEM_RELACIONAMENTO" })
      .eq("id", record2.id);
    expect(directUpdate.error).not.toBeNull();
  });

  it("closeWithoutRelationship persiste o motivo no payload do evento", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    const close = closeWithoutRelationship(record0, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
      reason: "Prefiro tentar outro caminho.",
    });
    const record1 = await repository.update(
      record0.status,
      close.record,
      close.event,
    );
    expect(record1.status).toBe("ENCERRADO_SEM_RELACIONAMENTO");

    const events = await repository.listEvents(record1.id);
    expect(events.at(-1)?.payload).toEqual({
      reason: "Prefiro tentar outro caminho.",
    });
  });

  it("correctChoice funciona enquanto DECISAO_REGISTRADA e fica indisponível depois de CONTATO_INICIADO", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    const corrected = correctChoice(
      record0,
      {
        requestedByPatientProfileId: patientProfileId,
        newProfessionalProfileId: professionalIds[1],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record1 = await repository.update(
      record0.status,
      corrected.record,
      corrected.event,
    );
    expect(record1.professionalProfileId).toBe(professionalIds[1]);

    const contact = registerContactIntent(record1, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    const record2 = await repository.update(
      record1.status,
      contact.record,
      contact.event,
    );

    expect(() =>
      correctChoice(
        record2,
        {
          requestedByPatientProfileId: patientProfileId,
          newProfessionalProfileId: professionalIds[2],
          actorId: patientProfileId,
          occurredAt: now,
          recordedAt: now,
        },
        { eligibleProfessionalProfileIds: professionalIds },
      ),
    ).toThrow(ConnectionError);
  });

  it("RLS: outro paciente não lê nem escreve no Connection alheio", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const otherEmail = unique("connection-outro") + "@aliviar-conexao.local";
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Outro Paciente" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);
    const otherClient = createClient(url, anonKey);
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: otherAccount.password,
    });

    const { data: readAttempt } = await otherClient
      .from("connection_records")
      .select("id")
      .eq("id", record0.id);
    expect(readAttempt ?? []).toHaveLength(0);

    const { error: writeAttempt } = await otherClient
      .from("connection_records")
      .update({ status: "ENCERRADO_SEM_RELACIONAMENTO" })
      .eq("id", record0.id);
    // RLS: 0 linhas afetadas (não é erro explícito, é filtro silencioso) —
    // confirmamos que o estado permanece intocado no banco.
    expect(writeAttempt).toBeNull();
    const stillIntact = await repository.findById(record0.id);
    expect(stillIntact?.status).toBe("DECISAO_REGISTRADA");

    const { error: eventWriteAttempt } = await otherClient
      .from("connection_events")
      .insert({
        connection_id: record0.id,
        event_type: "ENCERRADO_SEM_RELACIONAMENTO",
        actor_id: otherAccount.profileId,
        occurred_at: now,
        recorded_at: now,
      });
    expect(eventWriteAttempt).not.toBeNull();
  });

  it("append-only: nenhuma policy permite update/delete direto em connection_events", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);
    const events = await repository.listEvents(record0.id);

    const { error: updateError } = await patientClient
      .from("connection_events")
      .update({ payload: { adulterado: true } })
      .eq("id", events[0].id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await patientClient
      .from("connection_events")
      .delete()
      .eq("id", events[0].id);
    expect(deleteError).not.toBeNull();
  });

  it("Curador/Admin só leem — nenhuma escrita, mesmo sendo o curador atribuído ao Caso", async () => {
    const admin = await loginAs("administrador");
    const curador = await loginAs("curador_medico");
    const adminClient = createAdminSupabaseClient();

    const email = unique("connection-curador") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Connection Curador" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);
    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({
      email,
      password: patientAccount.password,
    });
    const draft = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Caso para teste de RLS de curador." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(
      admin.client,
      draft.id,
      curador.userId,
      admin.userId,
    );
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(
      admin.client,
      created.id,
      "READY_FOR_CURATION",
      admin.userId,
    );

    const professionalIds = [
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
    ];

    const execution = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(execution.outcome).toBe("completed");
    const review = await submitHumanReview(admin.client, {
      caseId: created.id,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });
    expect(review.outcome).toBe("recorded");
    const delivery = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(delivery.outcome).toBe("delivered");

    const now = new Date().toISOString();
    const repository = new SupabaseConnectionRepository(patientClient);
    const result = createConnection(
      {
        caseId: created.id,
        finalCuradoriaDeliveryId:
          delivery.outcome === "delivered" ? delivery.delivery.id : "",
        patientProfileId: patientAccount.profileId,
        professionalProfileId: professionalIds[0],
        actorId: patientAccount.profileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record = await repository.create(result.record, result.event);

    // Curador atribuído: lê, nunca escreve.
    const { data: curadorRead } = await curador.client
      .from("connection_records")
      .select("id")
      .eq("id", record.id);
    expect(curadorRead ?? []).toHaveLength(1);
    const { error: curadorWrite } = await curador.client
      .from("connection_records")
      .update({ status: "ENCERRADO_SEM_RELACIONAMENTO" })
      .eq("id", record.id);
    expect(curadorWrite).toBeNull(); // RLS filtra silenciosamente — 0 linhas afetadas
    const afterCuradorWrite = await repository.findById(record.id);
    expect(afterCuradorWrite?.status).toBe("DECISAO_REGISTRADA");
  });

  it("nenhuma ação de Connection altera CaseStatus, FinalCuradoria ou artefatos do ACE", async () => {
    const {
      admin,
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      finalCuradoriaDeliveryId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const before = await (
      await import("@/modules/cases/repository")
    ).getCase(admin.client, caseId);
    const deliveryBefore = await (
      await import("@/modules/concierge/delivery-repository")
    ).getFinalCuradoriaDeliveryForCase(admin.client, caseId);

    const created0 = createConnection(
      {
        caseId,
        finalCuradoriaDeliveryId,
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);
    const contact = registerContactIntent(record0, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    await repository.update(record0.status, contact.record, contact.event);

    const after = await (
      await import("@/modules/cases/repository")
    ).getCase(admin.client, caseId);
    const deliveryAfter = await (
      await import("@/modules/concierge/delivery-repository")
    ).getFinalCuradoriaDeliveryForCase(admin.client, caseId);

    expect(after?.status).toBe(before?.status);
    expect(after?.status).toBe("DELIVERED");
    expect(deliveryAfter).toEqual(deliveryBefore);
  });
});
