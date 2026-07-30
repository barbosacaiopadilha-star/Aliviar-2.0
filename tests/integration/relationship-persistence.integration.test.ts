import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { seedPublishedProfessional } from "./rede-fixture";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import {
  confirmFirstAppointment,
  createConnection,
} from "@/modules/connection/commands";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import {
  getOrCreateActiveStory,
  saveStoryDraft,
  submitStory,
} from "@/modules/story/repository";
import { completarMapaDePrioridades } from "./support-mapa";

// RELATIONSHIP ENGINE — MVP — PR1 (persistência). Nenhum domínio,
// repository ou Server Action de Relationship existe ainda (isso é escopo
// dos PRs seguintes) — este arquivo testa exclusivamente a camada de banco
// (migrations, RLS, triggers, RPCs) chamando as três funções
// `security invoker` diretamente via um client Supabase autenticado real,
// mesmo padrão já usado em connection.integration.test.ts antes de
// connection/repository.ts existir. "Não simular com mock aquilo que só o
// banco pode garantir" (Fase 3/Etapa 7): nenhuma constraint, trigger, RPC
// ou RLS abaixo é mockada.

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

describe("Relationship Engine — MVP — PR1 (persistência, RLS, triggers, RPCs — Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  let createdProfessionalIds: string[] = [];
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();
    // Pacientes e Cases PRIMEIRO, profissionais depois: a Curadoria canônica
    // grava `curated_selection_options` e `curadoria_report_options` com FK
    // para `professional_profiles`, e apagar o profissional antes do Case viola
    // a FK — o erro passava despercebido e o perfil sobrevivia à rodada.

    if (createdPatientProfileIds.length > 0) {
      // cases cascade para connection_records (PR1 do Connection) que
      // cascade para relationship_records (PR1 do Relationship, este
      // arquivo) que cascade para relationship_events.
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
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional Relationship ${unique("p")}`,
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

    await adminClient.from("professional_competency_areas").insert({
      professional_profile_id: professional.id,
      domain: "nao_determinado",
      focus: "avaliacao",
    });

    createdProfessionalIds.push(professional.id);
    return professional.id;
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

    // A Rede que este cenário exige. Antes ela vinha de sobra deixada por
    // outra suíte que rodava antes — dependência invisível entre arquivos,
    // que só apareceu quando a limpeza automática passou a funcionar. Agora
    // o cenário monta a própria Rede, e o `afterEach` a desfaz.
    const clienteAdmin = createAdminSupabaseClient();
    for (let i = 0; i < 3; i += 1) {
      // A fixture publicada — a única que `listApprovedProviders` devolve.
      // O helper local deste arquivo cria profissional apresentável, não
      // publicado: servia quando a Rede vinha pronta de outro lugar.
      createdProfessionalIds.push(
        await seedPublishedProfessional(clienteAdmin, curador.userId, "Profissional Relationship"),
      );
    }

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

    // M3: o record do COS não carrega mais as análises legadas — a fixture lê
    // a tabela histórica diretamente, que é exatamente o cenário que ela monta.
    const { data: analysesRows } = await cliente
      .from("compatibility_analyses")
      .select("professional_profile_id")
      .eq("priority_profile_id", priorityProfileId);
    const tres = (analysesRows ?? [])
      .slice(0, 3)
      .map((row) => ({ professionalId: row.professional_profile_id as string }));
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

  // Caso completo, entregue de verdade, com Connection já em
  // PRIMEIRO_ATENDIMENTO_REALIZADO — o único ponto de partida real e
  // honesto para testar Relationship, já que ele só nasce depois disso.
  async function createConnectionAtFirstAppointment() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("relationship") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Relationship" },
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

    const confirmed = confirmFirstAppointment(connectionRecord, {
      requestedByPatientProfileId: patientAccount.profileId,
      actorId: patientAccount.profileId,
      occurredAt: now,
      recordedAt: now,
    });
    const finalConnection = await connectionRepository.update(
      connectionRecord.status,
      confirmed.record,
      confirmed.event,
    );
    expect(finalConnection.status).toBe("PRIMEIRO_ATENDIMENTO_REALIZADO");

    return {
      admin,
      adminClient,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      // Os três efetivamente entregues: o trigger de coerência exige que
      // Relationship e Connection apontem para o mesmo profissional.
      professionalIds: entregues.professionalIds,
      connectionId: finalConnection.id,
    };
  }

  it("cria um RelationshipRecord real (RPC create_relationship_with_event) e o paciente consegue lê-lo (RLS)", async () => {
    const {
      patientClient,
      connectionId,
      patientProfileId,
      professionalIds,
      caseId,
    } = await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data, error } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    expect(error).toBeNull();
    expect(data.status).toBe("ATIVO");
    expect(data.connection_id).toBe(connectionId);
    expect(data.case_id).toBe(caseId);
    expect(data.patient_profile_id).toBe(patientProfileId);
    expect(data.professional_profile_id).toBe(professionalIds[0]);

    const { data: read, error: readError } = await patientClient
      .from("relationship_records")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    expect(readError).toBeNull();
    expect(read?.status).toBe("ATIVO");

    const { data: events, error: eventsError } = await patientClient
      .from("relationship_events")
      .select("*")
      .eq("relationship_id", data.id);
    expect(eventsError).toBeNull();
    expect(events).toHaveLength(1);
    expect(events![0].event_type).toBe("RELACIONAMENTO_INICIADO");
  });

  it("unicidade por Connection (23505): uma segunda criação para o mesmo connection_id é rejeitada", async () => {
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const first = await patientClient.rpc("create_relationship_with_event", {
      p_connection_id: connectionId,
      p_actor_id: patientProfileId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(first.error).toBeNull();

    const second = await patientClient.rpc("create_relationship_with_event", {
      p_connection_id: connectionId,
      p_actor_id: patientProfileId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(second.error).not.toBeNull();
    expect(second.error!.code).toBe("23505");

    const { data: all } = await patientClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionId);
    expect(all).toHaveLength(1);
  });

  it("rejeita a criação (23514) quando o Connection referenciado não está em PRIMEIRO_ATENDIMENTO_REALIZADO, e não deixa gravação parcial", async () => {
    // Connection em DECISAO_REGISTRADA (nunca chega a confirmFirstAppointment
    // nesta variante do setup) — usa o mesmo pipeline até a entrega, mas
    // cria o Connection sem confirmar o atendimento.
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("relationship-invalid") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Relationship Invalido" },
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
      { motivo: "Caso de teste — Connection sem primeiro atendimento." },
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

    const connectionRepository = new SupabaseConnectionRepository(patientClient);
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
    // Connection fica em DECISAO_REGISTRADA — nunca avança para
    // PRIMEIRO_ATENDIMENTO_REALIZADO nesta variante.
    const connectionRecord = await connectionRepository.create(
      created0.record,
      created0.event,
    );

    const { error } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionRecord.id,
        p_actor_id: patientAccount.profileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    expect(error).not.toBeNull();
    expect(error!.code).toBe("23514");

    const { data: records } = await patientClient
      .from("relationship_records")
      .select("id")
      .eq("connection_id", connectionRecord.id);
    expect(records).toHaveLength(0);

    const { data: orphanEvents } = await adminClient
      .from("relationship_events")
      .select("id")
      .eq("actor_id", patientAccount.profileId);
    expect(orphanEvents).toHaveLength(0);
  });

  // [CORRIGIDO — Fase 6.1] A versão anterior deste teste exercitava
  // ATIVO -> PAUSADO -> ATIVO -> ENCERRADO_PLANEJADO — construída sobre uma
  // teoria de Relationship anterior ao fechamento da Fase 4.1, que rejeitou
  // PAUSADO como estado e consolidou os dois terminais em um único
  // ENCERRADO. O fluxo completo agora é ATIVO -> ENCERRADO (único estado
  // terminal), via apply_relationship_transition.
  it("fluxo completo de transição: ATIVO -> ENCERRADO, via RPC apply_relationship_transition", async () => {
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    const closed = await patientClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(closed.error).toBeNull();
    expect(closed.data.status).toBe("ENCERRADO");

    // Estado terminal: qualquer nova transição é rejeitada pela RPC
    // (55000, pois expected_status nunca mais casa) e pelo trigger, se
    // contornado diretamente (ver teste de trigger abaixo).
    const afterTerminal = await patientClient.rpc(
      "apply_relationship_transition",
      {
        p_relationship_id: relationship.id,
        p_expected_status: "ENCERRADO",
        p_new_status: "ATIVO",
        p_event_type: "REABERTURA_OBSERVADA",
        p_actor_id: patientProfileId,
        p_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );
    expect(afterTerminal.error).not.toBeNull();

    const { data: events } = await patientClient
      .from("relationship_events")
      .select("event_type")
      .eq("relationship_id", relationship.id)
      .order("occurred_at", { ascending: true });
    expect(events!.map((e) => e.event_type)).toEqual([
      "RELACIONAMENTO_INICIADO",
      "ENCERRAMENTO_PLANEJADO_DECLARADO",
    ]);
  });

  it("trigger connection_records-like assert_relationship_valid_transition: rejeita transição direta na tabela contornando a RPC, mesmo a partir de estado terminal", async () => {
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    await patientClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "INTERRUPCAO_DECLARADA",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    const directUpdate = await patientClient
      .from("relationship_records")
      .update({ status: "ATIVO" })
      .eq("id", relationship.id);
    expect(directUpdate.error).not.toBeNull();

    const stillTerminal = await patientClient
      .from("relationship_records")
      .select("status")
      .eq("id", relationship.id)
      .maybeSingle();
    expect(stillTerminal.data?.status).toBe("ENCERRADO");
  });

  it("imutabilidade: connection_id, case_id, patient_profile_id e professional_profile_id nunca podem ser alterados após a criação", async () => {
    const { patientClient, connectionId, patientProfileId, professionalIds } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    const tryProfessional = await patientClient
      .from("relationship_records")
      .update({ professional_profile_id: professionalIds[1] })
      .eq("id", relationship.id);
    expect(tryProfessional.error).not.toBeNull();

    const stillOriginal = await patientClient
      .from("relationship_records")
      .select("professional_profile_id")
      .eq("id", relationship.id)
      .maybeSingle();
    expect(stillOriginal.data?.professional_profile_id).toBe(
      professionalIds[0],
    );
  });

  it("concorrência real numa transição (55000): duas tentativas simultâneas de ENCERRAMENTO_PLANEJADO_DECLARADO a partir do mesmo estado — exatamente uma sucede", async () => {
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    const attempt = () =>
      patientClient.rpc("apply_relationship_transition", {
        p_relationship_id: relationship.id,
        p_expected_status: "ATIVO",
        p_new_status: "ENCERRADO",
        p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
        p_actor_id: patientProfileId,
        p_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      });

    const [first, second] = await Promise.all([attempt(), attempt()]);
    const succeeded = [first, second].filter((r) => r.error === null);
    const failed = [first, second].filter((r) => r.error !== null);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].error!.code).toBe("55000");

    const { data: events } = await patientClient
      .from("relationship_events")
      .select("event_type")
      .eq("relationship_id", relationship.id);
    // A tentativa rejeitada não deixou evento órfão — apply_relationship_
    // transition insere o evento e atualiza o estado na mesma transação
    // implícita; se a cláusula WHERE não afeta linhas, a exceção desfaz o
    // INSERT do evento também.
    expect(events!.map((e) => e.event_type).sort()).toEqual(
      ["ENCERRAMENTO_PLANEJADO_DECLARADO", "RELACIONAMENTO_INICIADO"].sort(),
    );
  });

  it("RLS: outro paciente não lê nem escreve no Relationship alheio", async () => {
    const { connectionId, patientProfileId, adminClient } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const admin = await loginAs("administrador");
    const { data: relationship } = await adminClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    const otherEmail =
      unique("relationship-outsider") + "@aliviar-conexao.local";
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

    const { data: readAttempt } = await otherClient
      .from("relationship_records")
      .select("*")
      .eq("id", relationship.id)
      .maybeSingle();
    expect(readAttempt).toBeNull();

    const writeAttempt = await otherClient
      .from("relationship_records")
      .update({ status: "ENCERRADO" })
      .eq("id", relationship.id);
    const { data: stillIntact } = await adminClient
      .from("relationship_records")
      .select("status")
      .eq("id", relationship.id)
      .maybeSingle();
    expect(stillIntact?.status).toBe("ATIVO");
    void writeAttempt;
  });

  it("append-only: nenhuma policy permite update/delete direto em relationship_events", async () => {
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    const { data: events } = await patientClient
      .from("relationship_events")
      .select("id")
      .eq("relationship_id", relationship.id);

    const updateAttempt = await patientClient
      .from("relationship_events")
      .update({ event_type: "REABERTURA_OBSERVADA" })
      .eq("id", events![0].id);
    expect(updateAttempt.error).not.toBeNull();

    const deleteAttempt = await patientClient
      .from("relationship_events")
      .delete()
      .eq("id", events![0].id);
    expect(deleteAttempt.error).not.toBeNull();
  });

  it("RLS de eventos: paciente não consegue registrar INTERRUPCAO_DECLARADA/REABERTURA_OBSERVADA se não for equipe (mesmo sendo dono)", async () => {
    // A política de patient events não inclui REABERTURA_OBSERVADA, e a de
    // team events exige has_role('administrador') ou ser o curador
    // atribuído — um paciente comum, mesmo dono do Relationship, nunca
    // satisfaz nenhuma das duas para este evento específico.
    const { patientClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    await patientClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    const directInsert = await patientClient
      .from("relationship_events")
      .insert({
        relationship_id: relationship.id,
        event_type: "REABERTURA_OBSERVADA",
        actor_id: patientProfileId,
        payload: {},
        occurred_at: now,
        recorded_at: now,
      });
    expect(directInsert.error).not.toBeNull();
  });

  it("reabertura observada: equipe registra contra Relationship terminal, vinculada a um novo Caso real, sem alterar o status; pode repetir", async () => {
    const { adminClient, connectionId, patientProfileId, caseId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();
    const admin = await loginAs("administrador");

    const { data: relationship } = await adminClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    await adminClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    // "Novo Caso" real que fundamenta a reabertura — reaproveita o mesmo
    // Caso original apenas por conveniência de fixture (o teste valida a
    // exigência de "Caso real e existente", não a unicidade dele).
    const first = await admin.client.rpc("register_relationship_reopening", {
      p_relationship_id: relationship.id,
      p_new_case_id: caseId,
      p_actor_id: admin.userId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(first.error).toBeNull();
    expect(first.data.event_type).toBe("REABERTURA_OBSERVADA");
    expect(first.data.payload.newCaseId).toBe(caseId);

    const second = await admin.client.rpc("register_relationship_reopening", {
      p_relationship_id: relationship.id,
      p_new_case_id: caseId,
      p_actor_id: admin.userId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(second.error).toBeNull();

    const { data: stillClosed } = await admin.client
      .from("relationship_records")
      .select("status")
      .eq("id", relationship.id)
      .maybeSingle();
    expect(stillClosed?.status).toBe("ENCERRADO");

    const { data: reopeningEvents } = await admin.client
      .from("relationship_events")
      .select("id")
      .eq("relationship_id", relationship.id)
      .eq("event_type", "REABERTURA_OBSERVADA");
    expect(reopeningEvents).toHaveLength(2);
  });

  it("reabertura observada rejeita Relationship não-terminal (23514) e Caso inexistente (23503)", async () => {
    const { adminClient, connectionId, patientProfileId } =
      await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();
    const admin = await loginAs("administrador");

    const { data: relationship } = await adminClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );

    // Ainda ATIVO — reabertura deve ser rejeitada.
    const notTerminal = await admin.client.rpc(
      "register_relationship_reopening",
      {
        p_relationship_id: relationship.id,
        p_new_case_id: relationship.case_id,
        p_actor_id: admin.userId,
        p_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );
    expect(notTerminal.error).not.toBeNull();
    expect(notTerminal.error!.code).toBe("23514");

    await adminClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    const fakeCaseId = "00000000-0000-0000-0000-000000000000";
    const invalidCase = await admin.client.rpc(
      "register_relationship_reopening",
      {
        p_relationship_id: relationship.id,
        p_new_case_id: fakeCaseId,
        p_actor_id: admin.userId,
        p_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );
    expect(invalidCase.error).not.toBeNull();
    expect(invalidCase.error!.code).toBe("23503");
  });

  it("FK: create_relationship_with_event rejeita connection_id inexistente (23503)", async () => {
    const admin = await loginAs("administrador");
    const fakeConnectionId = "00000000-0000-0000-0000-000000000000";
    const now = new Date().toISOString();

    const { error } = await admin.client.rpc("create_relationship_with_event", {
      p_connection_id: fakeConnectionId,
      p_actor_id: admin.userId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    expect(error).not.toBeNull();
    expect(error!.code).toBe("23503");
  });

  it("nenhuma ação de Relationship altera Connection, Caso ou artefatos do ACE", async () => {
    const {
      patientClient,
      connectionId,
      patientProfileId,
      caseId,
      adminClient,
    } = await createConnectionAtFirstAppointment();
    const now = new Date().toISOString();

    const { data: connectionBefore } = await adminClient
      .from("connection_records")
      .select("*")
      .eq("id", connectionId)
      .maybeSingle();
    const { data: caseBefore } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();

    const { data: relationship } = await patientClient.rpc(
      "create_relationship_with_event",
      {
        p_connection_id: connectionId,
        p_actor_id: patientProfileId,
        p_event_payload: {},
        p_occurred_at: now,
        p_recorded_at: now,
      },
    );
    await patientClient.rpc("apply_relationship_transition", {
      p_relationship_id: relationship.id,
      p_expected_status: "ATIVO",
      p_new_status: "ENCERRADO",
      p_event_type: "ENCERRAMENTO_PLANEJADO_DECLARADO",
      p_actor_id: patientProfileId,
      p_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    const { data: connectionAfter } = await adminClient
      .from("connection_records")
      .select("*")
      .eq("id", connectionId)
      .maybeSingle();
    const { data: caseAfter } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();

    expect(connectionAfter).toEqual(connectionBefore);
    expect(caseAfter).toEqual(caseBefore);
  });
});
