import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import {
  closeWithoutRelationship,
  createConnection,
} from "@/modules/connection/commands";
import { ConnectionError } from "@/modules/connection/errors";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { seedPublishedProfessional } from "./rede-fixture";
import { reconstructRelationshipRecordFromRow } from "@/modules/relationship";
import { SupabaseRelationshipRepository } from "@/modules/relationship/repository";
import {
  getOrCreateActiveStory,
  saveStoryDraft,
  submitStory,
} from "@/modules/story/repository";
import { completarMapaDePrioridades } from "./support-mapa";

// RELATIONSHIP ENGINE — MVP — PR4 (nascimento automático). Testa a
// função transacional confirm_first_appointment_and_birth_relationship
// diretamente contra o Supabase local real (nenhuma constraint, trigger,
// RPC ou RLS mockada), mesma limitação/abordagem já documentada para as
// Server Actions ("use server" não roda sob next/headers no Vitest) — o
// mesmo caminho de dados que confirmFirstAppointmentAction exerceria.
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

describe("Relationship Engine — MVP — PR4 (nascimento automático — Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  let createdProfessionalIds: string[] = [];
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();

    // Pacientes e Cases PRIMEIRO, profissionais depois. O caminho canônico
    // grava `curated_selection_options` e `curadoria_report_options` com FK
    // para `professional_profiles`: apagar o profissional antes do Case viola
    // a FK, e o erro ignorado deixava o perfil sobreviver à rodada.
    if (createdPatientProfileIds.length > 0) {
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

    if (createdProfessionalIds.length > 0) {
      await adminClient
        .from("professional_competency_areas")
        .delete()
        .in("professional_profile_id", createdProfessionalIds);
      const { error } = await adminClient
        .from("professional_profiles")
        .delete()
        .in("id", createdProfessionalIds);
      // Falha silenciosa aqui foi a origem do vazamento. Agora ela aparece.
      if (error) {
        throw new Error(`teardown: profissionais não removidos — ${error.message}`);
      }
      createdProfessionalIds = [];
    }
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
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
    const id = await seedPublishedProfessional(adminClient, adminUserId, "Profissional PR4");
    createdProfessionalIds.push(id);
    return id;
  }

  /**
   * A Curadoria do Método, do critério à entrega, pelas mesmas funções que as
   * telas chamam. Devolve o Relatório entregue e os três profissionais que
   * chegaram ao paciente — nenhum protocolo do ACE participa.
   */
  async function deliverCanonically(
    curador: { client: ReturnType<typeof createCuradoriaClient>; userId: string },
    caseId: string,
  ) {
    const cliente = curador.client;

    await cliente.from("consultation_records").insert({
      case_id: caseId,
      curator_id: curador.userId,
      context_reviewed: true,
      documents_reviewed: true,
      narrative: "Ela contou a história inteira, e eu devolvi organizada.",
      understanding_confirmed_at: new Date().toISOString(),
    });
    await cliente
      .from("case_clinical_context")
      .insert({ case_id: caseId, clinical_context: "Contexto clínico relatado por ela." });

    const priorityProfileId = await curadoria.createPriorityProfile(cliente, caseId, curador.userId);
    await curadoria.addFilter(
      cliente,
      priorityProfileId,
      "FILTRO_OBRIGATORIO",
      "CUIDADO_CONTINUO",
      "true",
      "Ela quer alguém que acompanhe do começo ao fim.",
    );
    await completarMapaDePrioridades(cliente, priorityProfileId);
    await curadoria.validatePriorityProfile(cliente, priorityProfileId, "Li em voz alta e ela confirmou.");

    // M5: o motor legado nao existe mais. Os tres da fixture vem da Rede
    // publicada — o mesmo universo que a Mesa apresenta ao Curador.
    const { data: redeRows } = await cliente
      .from("professional_profiles")
      .select("id")
      .eq("status", "ativo")
      .eq("is_demo", false)
      .eq("publication_status", "publicado");
    const tres = (redeRows ?? [])
      .slice(0, 3)
      .map((row) => ({ professionalId: row.id as string }));
    expect(tres, "a rede local precisa ter três elegíveis para este cenário").toHaveLength(3);

    await curadoria.saveSelection(
      cliente,
      caseId,
      priorityProfileId,
      curador.userId,
      "Os três cobrem experiência e continuidade de formas diferentes.",
      tres.map((a) => ({
        professionalProfileId: a.professionalId,
        rationale: "Entra porque atende o que ela pediu.",
        tradeOff: "Agenda mais concorrida.",
      })),
    );
    const selection = await curadoria.getSelection(cliente, priorityProfileId);

    await reports.saveReport(
      cliente,
      caseId,
      selection!.id,
      "Os três cobrem experiência e continuidade de formas diferentes.",
      tres.map((a) => ({
        professionalProfileId: a.professionalId,
        justification: "Responde ao critério que ela nomeou.",
        relationToWeights: "Cobre experiência, que ela pesou mais.",
        attentionPoints: ["Agenda mais concorrida."],
        // G1/ETAPA-2: oráculo anterior certificava o defeito FS-04 (favorablePoints: []
        // replicado como payload normal — consertar o apagamento não quebraria teste
        // algum); novo oráculo exige o comportamento da ADR-064 (conteúdo do parecer
        // sobrevive ao round-trip, sem perda silenciosa); correção do defeito no Bloco D.
        favorablePoints: ["Acompanha casos como o dela ao longo do tempo."],
        suggestedQuestions: ["Quantos casos como o meu você acompanha por ano?"],
        curatorObservations: null,
      })),
    );
    const report = await reports.getReportBySelection(cliente, selection!.id);
    // G1/ETAPA-2 (FS-04/ADR-064): prova de round-trip na leitura de volta que o
    // teste já fazia — o conteúdo salvo precisa existir intacto no banco.
    const { data: opcoesRoundTrip } = await cliente
      .from("curadoria_report_options")
      .select("favorable_points")
      .eq("report_id", report!.id);
    expect(opcoesRoundTrip).toHaveLength(3);
    for (const opcao of opcoesRoundTrip ?? []) {
      expect(opcao.favorable_points).toEqual(["Acompanha casos como o dela ao longo do tempo."]);
    }
    // Emitir exige aprovação prévia — o Curador assume a autoria da versão final.
    await reports.approveReport(cliente, report!.id, curador.userId);
    await reports.emitReport(cliente, report!.id);
    await curadoria.deliverSelection(cliente, selection!.id);
    await reports.markReportDelivered(cliente, report!.id);

    return { reportId: report!.id, professionalIds: tres.map((a) => a.professionalId) };
  }

  // Connection ainda em DECISAO_REGISTRADA — o ponto de partida real para
  // testar a confirmação de primeiro atendimento (nunca já confirmado).
  async function createConnectionAwaitingFirstAppointment() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("pr4-birth") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente PR4" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
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
      { motivo: "Buscando continuidade de acompanhamento." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await submitStory(patientClient, draft.id, refreshed.revision);

    const curador = await loginAs("curador_medico");
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

    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);

    const entregues = await deliverCanonically(curador, created.id);

    const connectionRepository = new SupabaseConnectionRepository(
      patientClient,
    );
    const now = new Date().toISOString();
    const created0 = createConnection(
      {
        caseId: created.id,
        anchor: { source: "METODO" as const, reportId: entregues.reportId },
        patientProfileId: patientAccount.profileId,
        professionalProfileId: entregues.professionalIds[0],
        actorId: patientAccount.profileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: entregues.professionalIds },
    );
    const connectionRecord = await connectionRepository.create(
      created0.record,
      created0.event,
    );

    return {
      admin,
      adminClient,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      // Os três efetivamente entregues — a seleção canônica escolhe da rede
      // real, e o trigger de coerência exige que Relationship e Connection
      // apontem para o mesmo profissional.
      professionalIds: entregues.professionalIds,
      connectionRecord,
      connectionRepository,
    };
  }

  it("confirmação válida: Connection transiciona para PRIMEIRO_ATENDIMENTO_REALIZADO e o Relationship nasce em ATIVO, atomicamente", async () => {
    const {
      connectionRepository,
      connectionRecord,
      patientProfileId,
      caseId,
      professionalIds,
    } = await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const result =
      await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      );

    expect(result.connection.status).toBe("PRIMEIRO_ATENDIMENTO_REALIZADO");
    const relationship = reconstructRelationshipRecordFromRow(
      result.relationshipRow,
    );
    expect(relationship.status).toBe("ATIVO");
    expect(relationship.connectionId).toBe(connectionRecord.id);
    expect(relationship.caseId).toBe(caseId);
    expect(relationship.patientProfileId).toBe(patientProfileId);
    expect(relationship.professionalProfileId).toBe(professionalIds[0]);
    // Postgres serializa timestamps como +00:00, não Z — mesmo instante,
    // comparado por valor, nunca por igualdade de string exata.
    expect(new Date(relationship.startedAt).getTime()).toBe(
      new Date(now).getTime(),
    );
  });

  it("cria exatamente um evento em cada domínio, com occurredAt/recordedAt preservados", async () => {
    const {
      connectionRepository,
      connectionRecord,
      patientProfileId,
      patientClient,
    } = await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const result =
      await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      );
    const relationship = reconstructRelationshipRecordFromRow(
      result.relationshipRow,
    );

    const connectionEvents = await connectionRepository.listEvents(
      connectionRecord.id,
    );
    const finalAppointmentEvents = connectionEvents.filter(
      (e) => e.eventType === "PRIMEIRO_ATENDIMENTO_REALIZADO",
    );
    expect(finalAppointmentEvents).toHaveLength(1);
    expect(new Date(finalAppointmentEvents[0].occurredAt).getTime()).toBe(
      new Date(now).getTime(),
    );
    expect(new Date(finalAppointmentEvents[0].recordedAt).getTime()).toBe(
      new Date(now).getTime(),
    );

    // Reaproveita o mesmo client autenticado como paciente — leitura
    // permitida pela mesma RLS já validada em PR1/PR3.
    const relationshipRepository = new SupabaseRelationshipRepository(
      patientClient,
    );
    const relationshipEvents = await relationshipRepository.listEvents(
      relationship.id,
    );
    expect(relationshipEvents).toHaveLength(1);
    expect(relationshipEvents[0].eventType).toBe("RELACIONAMENTO_INICIADO");
    expect(new Date(relationshipEvents[0].occurredAt).getTime()).toBe(
      new Date(now).getTime(),
    );
    expect(new Date(relationshipEvents[0].recordedAt).getTime()).toBe(
      new Date(now).getTime(),
    );
  });

  it("repetição após sucesso não duplica o Relationship — falha explícita (CONCURRENT_CONFLICT)", async () => {
    const { connectionRepository, connectionRecord, patientProfileId } =
      await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
      connectionRecord.status,
      { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
      {
        eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
        actorId: patientProfileId,
        payload: {},
        occurredAt: now,
        recordedAt: now,
      },
      {
        eventType: "RELACIONAMENTO_INICIADO",
        actorId: patientProfileId,
        payload: {},
        occurredAt: now,
        recordedAt: now,
      },
    );

    // Repetir com o MESMO previousStatus original (DECISAO_REGISTRADA) —
    // o Connection já não está mais nesse estado, então a concorrência
    // otimista rejeita antes mesmo de tentar criar um segundo
    // Relationship.
    await expect(
      connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      ),
    ).rejects.toMatchObject({ code: "CONCURRENT_CONFLICT" });

    const relationshipRepository = new SupabaseRelationshipRepository(
      createAdminSupabaseClient(),
    );
    const relationship = await relationshipRepository.findByCaseId(
      connectionRecord.caseId,
    );
    expect(relationship).not.toBeNull();
  });

  it("concorrência real: duas confirmações simultâneas para o mesmo Connection — exatamente um Relationship nasce", async () => {
    const { connectionRepository, connectionRecord, patientProfileId } =
      await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const attempt = () =>
      connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      );

    const [first, second] = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = [first, second].filter((r) => r.status === "fulfilled");
    const rejected = [first, second].filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ConnectionError);
    expect((rejected[0].reason as ConnectionError).code).toBe(
      "CONCURRENT_CONFLICT",
    );

    const adminClient = createAdminSupabaseClient();
    const { data: relationships } = await adminClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionRecord.id);
    expect(relationships).toHaveLength(1);

    const { data: connectionEvents } = await adminClient
      .from("connection_events")
      .select("id")
      .eq("connection_id", connectionRecord.id)
      .eq("event_type", "PRIMEIRO_ATENDIMENTO_REALIZADO");
    // A tentativa perdedora não deixa evento órfão — o INSERT do evento
    // de Connection e o UPDATE de estado estão na mesma transação da
    // função; se o UPDATE falha (0 linhas), tudo é desfeito, incluindo o
    // INSERT do evento que a aconteceu antes na mesma chamada.
    expect(connectionEvents).toHaveLength(1);
  });

  it("confirmação concorrente com encerramento (closeWithoutRelationship): apenas um desfecho vence, nenhum estado parcial", async () => {
    const { connectionRepository, connectionRecord, patientProfileId } =
      await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const confirmAttempt = () =>
      connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      );

    const closeResult = closeWithoutRelationship(connectionRecord, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    const closeAttempt = () =>
      connectionRepository.update(
        connectionRecord.status,
        closeResult.record,
        closeResult.event,
      );

    const [confirmSettled, closeSettled] = await Promise.allSettled([
      confirmAttempt(),
      closeAttempt(),
    ]);

    const outcomes = [confirmSettled, closeSettled];
    const fulfilled = outcomes.filter((r) => r.status === "fulfilled");
    const rejected = outcomes.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const adminClient = createAdminSupabaseClient();
    const { data: finalConnection } = await adminClient
      .from("connection_records")
      .select("status")
      .eq("id", connectionRecord.id)
      .maybeSingle();
    expect([
      "PRIMEIRO_ATENDIMENTO_REALIZADO",
      "ENCERRADO_SEM_RELACIONAMENTO",
    ]).toContain(finalConnection?.status);

    const { data: relationships } = await adminClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionRecord.id);
    // Relationship só existe se e somente se a confirmação foi a
    // vencedora — nunca um Relationship "sobrando" se o encerramento
    // venceu, nunca ausente se a confirmação venceu.
    if (finalConnection?.status === "PRIMEIRO_ATENDIMENTO_REALIZADO") {
      expect(relationships).toHaveLength(1);
    } else {
      expect(relationships).toHaveLength(0);
    }
  });

  it("Connection negativo (ENCERRADO_SEM_RELACIONAMENTO) nunca cria Relationship, mesmo contornando o domínio", async () => {
    const { connectionRepository, connectionRecord, patientProfileId } =
      await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const closeResult = closeWithoutRelationship(connectionRecord, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: now,
      recordedAt: now,
    });
    await connectionRepository.update(
      connectionRecord.status,
      closeResult.record,
      closeResult.event,
    );

    // Contorna o domínio de propósito — chama a função transacional
    // diretamente com o status ANTIGO como esperado, mesmo o Connection
    // já estando ENCERRADO_SEM_RELACIONAMENTO — prova que o banco (não só
    // o domínio) rejeita.
    await expect(
      connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      ),
    ).rejects.toMatchObject({ code: "CONCURRENT_CONFLICT" });

    const adminClient = createAdminSupabaseClient();
    const { data: relationships } = await adminClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionRecord.id);
    expect(relationships).toHaveLength(0);
  });

  it("Connection alheio é rejeitado pela RLS — outro paciente não consegue confirmar nem fazer nascer o Relationship", async () => {
    const { connectionRecord, patientProfileId, adminClient, admin } =
      await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const otherEmail = unique("pr4-outsider") + "@aliviar-conexao.local";
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Paciente Alheio PR4" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);
    const otherClient = createCuradoriaClient(url, anonKey);
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: otherAccount.password,
    });

    const otherRepository = new SupabaseConnectionRepository(otherClient);

    await expect(
      otherRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: otherAccount.profileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: otherAccount.profileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      ),
    ).rejects.toThrow();

    const { data: relationships } = await adminClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionRecord.id);
    expect(relationships).toHaveLength(0);
    void patientProfileId;
  });

  it("nenhuma ação de nascimento altera Caso ou Curadoria; nenhum ExperienceSignal ou reabertura é criado", async () => {
    const {
      connectionRepository,
      connectionRecord,
      patientProfileId,
      caseId,
      adminClient,
    } = await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const { data: caseBefore } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();
    const { data: deliveryBefore } = await adminClient
      .from("final_curadoria_deliveries")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();

    const result =
      await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
        connectionRecord.status,
        { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
        {
          eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      );
    const relationship = reconstructRelationshipRecordFromRow(
      result.relationshipRow,
    );

    const { data: caseAfter } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();
    const { data: deliveryAfter } = await adminClient
      .from("final_curadoria_deliveries")
      .select("*")
      .eq("case_id", caseId)
      .maybeSingle();

    expect(caseAfter).toEqual(caseBefore);
    expect(deliveryAfter).toEqual(deliveryBefore);

    const { data: relationshipEvents } = await adminClient
      .from("relationship_events")
      .select("event_type")
      .eq("relationship_id", relationship.id);
    expect(relationshipEvents!.map((e) => e.event_type)).toEqual([
      "RELACIONAMENTO_INICIADO",
    ]);
    expect(
      relationshipEvents!.some((e) => e.event_type === "REABERTURA_OBSERVADA"),
    ).toBe(false);
  });

  // [Fase 6.2 — Parte 7] paciente/curadoria/page.tsx só busca o
  // Relationship quando `connection?.status === "PRIMEIRO_ATENDIMENTO_
  // REALIZADO"`, via `relationshipRepository.findByCaseId(delivery.caseId)`
  // — exatamente a chamada exercida aqui. A página não tem nenhuma lógica
  // de domínio própria (auditado, Fase 6.2 Parte 2); portanto provar que
  // esta chamada retorna null antes do nascimento e o registro correto
  // depois é o teste mais próximo possível de "testar a página" dado que
  // Server Components com `createServerSupabaseClient()` não rodam sob
  // Vitest (mesma limitação transversal já documentada para Server
  // Actions em `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`).
  it("página de Curadoria: findByCaseId(caseId) — null antes do nascimento, ATIVO depois, nunca vaza para outro paciente", async () => {
    const {
      connectionRepository,
      connectionRecord,
      patientProfileId,
      caseId,
      patientClient,
      admin,
    } = await createConnectionAwaitingFirstAppointment();
    const now = new Date().toISOString();

    const relationshipRepositoryAsPatient = new SupabaseRelationshipRepository(
      patientClient,
    );
    const beforeBirth =
      await relationshipRepositoryAsPatient.findByCaseId(caseId);
    expect(beforeBirth).toBeNull();

    await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
      connectionRecord.status,
      { ...connectionRecord, status: "PRIMEIRO_ATENDIMENTO_REALIZADO" },
      {
        eventType: "PRIMEIRO_ATENDIMENTO_REALIZADO",
        actorId: patientProfileId,
        payload: {},
        occurredAt: now,
        recordedAt: now,
      },
      {
        eventType: "RELACIONAMENTO_INICIADO",
        actorId: patientProfileId,
        payload: {},
        occurredAt: now,
        recordedAt: now,
      },
    );

    const afterBirth =
      await relationshipRepositoryAsPatient.findByCaseId(caseId);
    expect(afterBirth?.status).toBe("ATIVO");
    expect(afterBirth?.caseId).toBe(caseId);

    const otherEmail = unique("pr4-page-outsider") + "@aliviar-conexao.local";
    const adminClient = createAdminSupabaseClient();
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Paciente Sem Relação (página)" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);
    const otherClient = createCuradoriaClient(url, anonKey);
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: otherAccount.password,
    });
    const relationshipRepositoryAsOutsider = new SupabaseRelationshipRepository(
      otherClient,
    );
    const asOutsider =
      await relationshipRepositoryAsOutsider.findByCaseId(caseId);
    expect(asOutsider).toBeNull();
  });
});
