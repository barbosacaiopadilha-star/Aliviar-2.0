import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { seedPublishedProfessional } from "./rede-fixture";
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
import { completarMapaDePrioridades } from "./support-mapa";

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

    // Pacientes e Cases PRIMEIRO, profissionais depois.
    //
    // A ordem importa desde a migração para o caminho canônico: a Curadoria do
    // Método grava `curated_selection_options` e `curadoria_report_options` com
    // FK para `professional_profiles`. Apagar o profissional antes do Case viola
    // a FK, o erro não é verificado, e o profissional sobrevive à rodada — foi
    // exatamente assim que a rede publicada cresceu ~70 perfis por execução.
    // (No fixture antigo do ACE os profissionais viviam num JSON, sem FK, e a
    // ordem invertida passava despercebida.)
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
    const id = await seedPublishedProfessional(adminClient, adminUserId, "Profissional Connection");
    createdProfessionalIds.push(id);
    return id;
  }

  // Caso entregue pela Curadoria do Método: a entrega canônica é o ponto de
  // partida do Connection, que nasce ancorado no Relatório entregue — não
  // mais em uma entrega do motor antigo (ADR-035).
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
    await curadoria.runCompatibility(cliente, priorityProfileId);

    const record = await loadCuradoriaRecord(cliente, caseId);
    const tres = record!.curadoriaTecnica.analyses.slice(0, 3);
    expect(tres, "a rede local precisa ter três elegíveis para este cenário").toHaveLength(3);

    await curadoria.saveSelection(
      cliente,
      caseId,
      priorityProfileId,
      curador.userId,
      "Os três cobrem experiência e continuidade de formas diferentes.",
      tres.map((a) => ({
        professionalProfileId: a.professionalId,
        band: a.band,
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
        favorablePoints: [],
        suggestedQuestions: ["Quantos casos como o meu você acompanha por ano?"],
        curatorObservations: null,
      })),
    );
    const report = await reports.getReportBySelection(cliente, selection!.id);
    // Emitir exige aprovação prévia — o Curador assume a autoria da versão final.
    await reports.approveReport(cliente, report!.id, curador.userId);
    await reports.emitReport(cliente, report!.id);
    await curadoria.deliverSelection(cliente, selection!.id);
    await reports.markReportDelivered(cliente, report!.id);

    return { reportId: report!.id, professionalIds: tres.map((a) => a.professionalId) };
  }
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
      { motivo: "Buscando apoio para dor crônica." },
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

    const professionalIds = [
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
    ];

    // A Curadoria do Método, percorrida pelas mesmas funções que as telas
    // chamam: critérios → validação → comparação → seleção humana → Relatório
    // → emissão → entrega. Nenhum protocolo do ACE participa.
    const cliente = curador.client;

    await cliente.from("consultation_records").insert({
      case_id: created.id,
      curator_id: curador.userId,
      context_reviewed: true,
      documents_reviewed: true,
      narrative: "Ela contou a história inteira, e eu devolvi organizada.",
      understanding_confirmed_at: new Date().toISOString(),
    });
    await cliente
      .from("case_clinical_context")
      .insert({ case_id: created.id, clinical_context: "Contexto clínico relatado por ela." });

    const priorityProfileId = await curadoria.createPriorityProfile(
      cliente,
      created.id,
      curador.userId,
    );
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
    await curadoria.runCompatibility(cliente, priorityProfileId);

    const record = await loadCuradoriaRecord(cliente, created.id);
    const tres = record!.curadoriaTecnica.analyses.slice(0, 3);
    expect(tres, "a rede local precisa ter três elegíveis para este cenário").toHaveLength(3);

    await curadoria.saveSelection(
      cliente,
      created.id,
      priorityProfileId,
      curador.userId,
      "Os três cobrem experiência e continuidade de formas diferentes.",
      tres.map((a) => ({
        professionalProfileId: a.professionalId,
        band: a.band,
        rationale: "Entra porque atende o que ela pediu.",
        tradeOff: "Agenda mais concorrida.",
      })),
    );
    const selection = await curadoria.getSelection(cliente, priorityProfileId);

    await reports.saveReport(
      cliente,
      created.id,
      selection!.id,
      "Os três cobrem experiência e continuidade de formas diferentes.",
      tres.map((a) => ({
        professionalProfileId: a.professionalId,
        justification: "Responde ao critério que ela nomeou.",
        relationToWeights: "Cobre experiência, que ela pesou mais.",
        attentionPoints: ["Agenda mais concorrida."],
        favorablePoints: [],
        suggestedQuestions: ["Quantos casos como o meu você acompanha por ano?"],
        curatorObservations: null,
      })),
    );
    const report = await reports.getReportBySelection(cliente, selection!.id);
    // Emitir exige aprovação prévia — o Curador assume a autoria da versão final.
    await reports.approveReport(cliente, report!.id, curador.userId);
    await reports.emitReport(cliente, report!.id);
    await curadoria.deliverSelection(cliente, selection!.id);
    await reports.markReportDelivered(cliente, report!.id);

    return {
      admin,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      // Os três efetivamente entregues — é entre eles que o paciente escolhe.
      professionalIds: tres.map((a) => a.professionalId),
      // Fora da entrega: serve aos testes que provam recusa de externo.
      outsiderProfessionalId: professionalIds[0],
      reportId: report!.id,
    };
  }

  it("cria um Connection real (RPC create_connection_with_event) e o paciente consegue lê-lo (RLS)", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);

    const now = new Date().toISOString();
    const result = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const first = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record = await repository.create(first.record, first.event);

    const second = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId,
        professionalProfileId: professionalIds[1],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );

    // Contrato canônico: repetir a escolha devolve a Connection existente em
    // vez de lançar. A unicidade continua garantida pelo índice por Case — o
    // que mudou é que retry deixou de ser erro, e virou resposta idempotente.
    const again = await repository.create(second.record, second.event);
    expect(again.id).toBe(record.id);
  });

  it("concorrência real: duas tentativas simultâneas de criar Connection para o mesmo Caso — exatamente uma sucede", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const attempt = () => {
      const result = createConnection(
        {
          caseId,
          anchor: { source: "METODO" as const, reportId },
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
    // O invariante é uma única Connection para o Case. A corrida pode terminar
    // com as duas chamadas bem-sucedidas (idempotência) ou com uma rejeitada
    // pelo índice único, dependendo de quem chega primeiro — as duas formas são
    // corretas. O que nunca pode acontecer é nascerem duas.
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    // Instantes distintos: `listEvents` ordena por `occurred_at`, e três eventos
    // com o mesmo carimbo têm ordem indefinida — o desempate variava conforme a
    // carga da suíte. Na vida real a pessoa age em momentos diferentes, e o
    // teste passa a refletir isso sem afrouxar a asserção de sequência.
    const depois = (ms: number) => new Date(Date.parse(now) + ms).toISOString();

    const contact = registerContactIntent(record0, {
      requestedByPatientProfileId: patientProfileId,
      actorId: patientProfileId,
      occurredAt: depois(1000),
      recordedAt: depois(1000),
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
      occurredAt: depois(2000),
      recordedAt: depois(2000),
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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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
      // Depois do evento de decisão — `events.at(-1)` só é o encerramento se os
      // carimbos forem distintos.
      occurredAt: new Date(Date.parse(now) + 1000).toISOString(),
      recordedAt: new Date(Date.parse(now) + 1000).toISOString(),
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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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
    const otherClient = createCuradoriaClient(url, anonKey);
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
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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

    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);

    const entregues = await deliverCanonically(curador, created.id);

    const now = new Date().toISOString();
    const repository = new SupabaseConnectionRepository(patientClient);
    const result = createConnection(
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
      reportId,
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
        anchor: { source: "METODO" as const, reportId },
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

    // O que este teste protege é que nenhuma ação de Connection mexe no Case
    // nem na entrega — por isso a comparação é com o estado anterior, e não
    // com um valor fixo. A entrega canônica não altera o status do Case.
    expect(after?.status).toBe(before?.status);
    expect(deliveryAfter).toEqual(deliveryBefore);
  });

  // Fase 4 — os testes acima cobrem concorrência na CRIAÇÃO (23505, via
  // create_connection_with_event) e defesa de RLS/trigger sobre um
  // ConnectionRecord já existente do próprio paciente. Os quatro testes
  // abaixo fecham lacunas reais identificadas na auditoria de integração:
  // concorrência otimista numa TRANSIÇÃO (apply_connection_transition,
  // 55000 — mecanismo distinto do 23505 da criação, nunca antes exercitado
  // contra o banco real) e defesa em profundidade do banco (RLS de insert
  // e os dois triggers do PR1) quando a chamada contorna o domínio
  // (commands.ts) — provando que a garantia não depende só da aplicação.

  it("concorrência real numa transição (RPC apply_connection_transition, 55000): duas tentativas simultâneas de registerContactIntent a partir do mesmo estado — exatamente uma sucede", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId,
        professionalProfileId: professionalIds[0],
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const record0 = await repository.create(created0.record, created0.event);

    const attempt = () => {
      const contact = registerContactIntent(record0, {
        requestedByPatientProfileId: patientProfileId,
        actorId: patientProfileId,
        // Depois do evento de decisão: `listEvents` ordena por `occurred_at` e
        // carimbos iguais têm ordem indefinida.
        occurredAt: new Date(Date.parse(now) + 1000).toISOString(),
        recordedAt: new Date(Date.parse(now) + 1000).toISOString(),
      });
      return repository.update(record0.status, contact.record, contact.event);
    };

    const outcomes = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter(
      (o): o is PromiseRejectedResult => o.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ConnectionError);
    expect((rejected[0].reason as ConnectionError).code).toBe(
      "CONCURRENT_CONFLICT",
    );

    const final = await repository.findById(record0.id);
    expect(final?.status).toBe("CONTATO_INICIADO");

    // Só o evento da transição aceita foi persistido — a rejeitada não
    // deixou evento órfão (apply_connection_transition insere o evento e
    // atualiza o estado na mesma transação implícita; se a cláusula WHERE
    // não afeta linhas, a exceção desfaz o INSERT do evento também).
    const events = await repository.listEvents(record0.id);
    expect(events.map((e) => e.eventType)).toEqual([
      "DECISAO_REGISTRADA",
      "CONTATO_INICIADO",
    ]);
  });

  it("RLS insert: paciente não consegue criar Connection atribuindo a decisão a outro paciente (defesa em profundidade, contornando o domínio)", async () => {
    const {
      caseId,
      patientProfileId: ownerProfileId,
      professionalIds,
      reportId,
    } = await createDeliveredCase();

    // Segundo paciente, sem nenhuma relação com este Caso — usa o próprio
    // client autenticado (auth.uid() = seu próprio id) para tentar criar um
    // Connection cujo patient_profile_id é o do DONO real do Caso. A
    // policy "connection_records_insert_own_patient" exige
    // patient_profile_id = auth.uid(); como os dois nunca coincidem aqui,
    // a rejeição precisa vir do banco, não da aplicação (que nem chega a
    // rodar — chamamos o repository diretamente, pulando commands.ts).
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const otherEmail = unique("connection-spoof") + "@aliviar-conexao.local";
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Paciente Sem Relação" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);
    const otherClient = createCuradoriaClient(url, anonKey);
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: otherAccount.password,
    });

    const repository = new SupabaseConnectionRepository(otherClient);
    const now = new Date().toISOString();
    const spoofed = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId: ownerProfileId,
        professionalProfileId: professionalIds[0],
        actorId: ownerProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );

    await expect(
      repository.create(spoofed.record, spoofed.event),
    ).rejects.toThrow();

    const stillEmpty = await repository.findByCaseId(caseId);
    expect(stillEmpty).toBeNull();
  });

  it("trigger connection_records_assert_professional_in_delivery: profissional fora da entrega é rejeitado mesmo contornando o domínio", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    // Profissional real, publicável, mas NUNCA apresentado nesta entrega —
    // o domínio (assertProfessionalEligible) barraria isso antes de chegar
    // ao banco; aqui chamamos o repository diretamente para provar que o
    // trigger do PR1 também barra, independentemente da aplicação.
    const adminClient = createAdminSupabaseClient();
    const admin = await loginAs("administrador");
    const outsiderId = await seedPresentableProfessional(
      adminClient,
      admin.userId,
    );
    createdProfessionalIds.push(outsiderId);

    const attempt = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
        patientProfileId,
        professionalProfileId: outsiderId,
        actorId: patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      // eligibleProfessionalProfileIds mentindo de propósito — simula uma
      // chamada que pulou a validação de domínio; a garantia real deve vir
      // do banco.
      { eligibleProfessionalProfileIds: [outsiderId] },
    );

    await expect(
      repository.create(attempt.record, attempt.event),
    ).rejects.toThrow();

    const stillEmpty = await repository.findByCaseId(caseId);
    expect(stillEmpty).toBeNull();
  });

  it("trigger connection_records_assert_valid_transition: correção de profissional após estado terminal é rejeitada pelo banco, não só pelo domínio", async () => {
    const {
      caseId,
      patientProfileId,
      patientClient,
      professionalIds,
      reportId,
    } = await createDeliveredCase();
    const repository = new SupabaseConnectionRepository(patientClient);
    const now = new Date().toISOString();

    const created0 = createConnection(
      {
        caseId,
        anchor: { source: "METODO" as const, reportId },
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

    // O domínio já rejeita correctChoice em estado terminal antes de tocar
    // o banco (coberto no teste de correctChoice acima). Aqui provamos que
    // o próprio trigger também rejeita, inserindo diretamente contra a
    // tabela — a mesma defesa em profundidade já aplicada ao status.
    const adminClient = createAdminSupabaseClient();
    const directUpdate = await adminClient
      .from("connection_records")
      .update({ professional_profile_id: professionalIds[1] })
      .eq("id", record2.id);
    expect(directUpdate.error).not.toBeNull();

    const stillIntact = await repository.findById(record2.id);
    expect(stillIntact?.professionalProfileId).toBe(professionalIds[0]);
  });
});
