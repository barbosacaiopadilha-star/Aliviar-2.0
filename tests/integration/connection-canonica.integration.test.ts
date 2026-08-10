import { fixtureValidarPerfil } from "../apoio/fixture-perfil";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import * as curadoria from "@/modules/curadoria/repository";
import * as reports from "@/modules/curadoria/report-repository";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { findDeliveredCuradoria } from "@/modules/curadoria/delivery-contract";
import { createConnection } from "@/modules/connection/commands";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import { createContact, createTask, getCaseById } from "@/modules/crm/repository";

import { createCuradoriaClient } from "./curadoria-client";
import { completarMapaDePrioridades } from "./support-mapa";

/**
 * CERTIFICAÇÃO — Connection nasce da entrega canônica, sem o motor antigo.
 *
 * Prova as duas coisas que faltavam para desacoplar Connection do ACE:
 * o ciclo canônico ponta a ponta, e o isolamento por papel na RLS nova.
 *
 * Nada aqui usa service role no caminho da decisão: todo client é de usuário
 * autenticado, sob RLS. O service role só aparece para criar contas e para
 * auditar o banco depois — nunca para fazer o fluxo andar.
 */

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users`.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@aliviar-conexao.local`;
}

describe("Connection canônica — sem final_curadoria_deliveries", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url).toBeTruthy();
    expect(anonKey).toBeTruthy();
    accounts = loadTestAccounts();
  });

  // Cada cenário cria um paciente e um Case. Sem esta limpeza eles sobrevivem à
  // rodada, e a rede publicada cresce a cada execução — o que torna
  // `runCompatibility` progressivamente mais caro e degrada a suíte inteira.
  // Os Cases levam junto, por cascade, seleções, Relatórios, análises,
  // Connections e eventos.
  const createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    if (createdPatientProfileIds.length === 0) return;
    const admin = createAdminSupabaseClient();

    await admin.from("cases").delete().in("patient_profile_id", createdPatientProfileIds);
    await admin.from("patient_stories").delete().in("profile_id", createdPatientProfileIds);
    await admin.from("patient_profiles").delete().in("profile_id", createdPatientProfileIds);
    await admin.from("user_roles").delete().in("profile_id", createdPatientProfileIds);
    for (const profileId of createdPatientProfileIds) {
      await admin.auth.admin.deleteUser(profileId);
    }
    createdPatientProfileIds.length = 0;
  });

  async function loginAs(role: string) {
    const account = accounts.find((entry) => entry.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  /**
   * Monta um Case entregue exclusivamente pelo Método, percorrendo as mesmas
   * funções que as telas chamam. Nenhuma linha é escrita em
   * `final_curadoria_deliveries` — é justamente o que se quer provar.
   *
   * Devolve `null` quando a rede local não tem três elegíveis: preferimos não
   * certificar a fabricar profissionais só para o teste passar.
   */
  // `entregar: false` para o cenário "emitido, não entregue": desde o Bloco C
  // (20260802160000) o fato da entrega não é apagável — o estado pré-entrega
  // é CONSTRUÍDO (cadeia parada antes de deliverSelection), nunca revertido.
  async function deliveredCanonicalCase({ entregar = true }: { entregar?: boolean } = {}) {
    const admin = await loginAs("administrador");
    const curador = await loginAs("curador_medico");
    const service = createAdminSupabaseClient();

    const email = uniqueEmail("connection-canonica");
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Connection Canônica" },
      admin.userId,
    );
    createdPatientProfileIds.push(paciente.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: paciente.password });

    const draft = await getOrCreateActiveStory(patientClient, paciente.profileId);
    const story = await submitStory(patientClient, draft.id, draft.revision);
    const kase = await createCase(admin.client, story.id, curador.userId, admin.userId);
    const caseId = kase.id;
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
    await fixtureValidarPerfil(cliente, priorityProfileId, "Li em voz alta e ela confirmou.");

    // M5: o motor legado nao existe mais. Os tres da fixture vem da Rede
    // publicada — o mesmo universo que a Mesa apresenta ao Curador.
    const { data: redeRows } = await cliente
      .from("professional_profiles")
      .select("id")
      .eq("status", "ativo")
      .eq("is_demo", false)
      .eq("publication_status", "publicado");
    const analyses = (redeRows ?? []).map((row) => ({
      professionalId: row.id as string,
    }));
    if (analyses.length < 3) return null;

    const tres = analyses.slice(0, 3);
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
    if (entregar) {
      await curadoria.deliverSelection(cliente, selection!.id);
      await reports.markReportDelivered(cliente, report!.id);
    }

    return {
      service,
      admin,
      curador,
      caseId,
      patientClient,
      patientProfileId: paciente.profileId,
      reportId: report!.id,
      selectionId: selection!.id,
      professionalIds: tres.map((a) => a.professionalId),
    };
  }

  it("o contrato reconhece a entrega, e ela ancora no Relatório — não no motor antigo", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);

    expect(delivery?.source).toBe("METODO");
    expect(delivery?.anchor).toEqual({ source: "METODO", reportId: scenario.reportId });
    expect(delivery?.options).toHaveLength(3);
  });

  it("o paciente lê as três opções e a escolha cria Connection pela âncora canônica", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const vista = await loadPatientCuradoria(scenario.patientClient);
    expect(vista?.options).toHaveLength(3);

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const escolhido = delivery!.options[0]!.professionalProfileId;
    const now = new Date().toISOString();

    const result = createConnection(
      {
        caseId: scenario.caseId,
        anchor: delivery!.anchor,
        patientProfileId: scenario.patientProfileId,
        professionalProfileId: escolhido,
        actorId: scenario.patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
    );

    const repository = new SupabaseConnectionRepository(scenario.patientClient);
    const connection = await repository.create(result.record, result.event);

    expect(connection.anchor).toEqual({ source: "METODO", reportId: scenario.reportId });
    expect(connection.status).toBe("DECISAO_REGISTRADA");

    // A linha no banco, auditada por service role: âncora canônica preenchida,
    // âncora legada nula.
    const { data: row } = await scenario.service
      .from("connection_records")
      .select("id, curadoria_report_id, final_curadoria_delivery_id, case_id")
      .eq("case_id", scenario.caseId)
      .single();

    expect(row!.curadoria_report_id).toBe(scenario.reportId);
    expect(row!.final_curadoria_delivery_id).toBeNull();

    // O evento inicial nasceu na mesma transação.
    const { data: events } = await scenario.service
      .from("connection_events")
      .select("id, event_type")
      .eq("connection_id", connection.id);
    expect(events).toHaveLength(1);
    expect(events![0]!.event_type).toBe("DECISAO_REGISTRADA");

    // Nenhuma escrita do motor antigo em nenhuma das quatro tabelas.
    for (const table of ["final_curadoria_deliveries", "human_review_results"]) {
      const { data } = await scenario.service.from(table).select("id").eq("case_id", scenario.caseId);
      expect(data ?? [], `${table} não pode receber linha no ciclo canônico`).toHaveLength(0);
    }
    const { data: execs } = await scenario.service
      .from("ace_executions")
      .select("id")
      .eq("case_id", scenario.caseId);
    expect(execs ?? []).toHaveLength(0);
  });

  it("repetir a escolha devolve a mesma Connection, sem segundo evento", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const repository = new SupabaseConnectionRepository(scenario.patientClient);
    const now = new Date().toISOString();

    const build = (professionalProfileId: string) =>
      createConnection(
        {
          caseId: scenario.caseId,
          anchor: delivery!.anchor,
          patientProfileId: scenario.patientProfileId,
          professionalProfileId,
          actorId: scenario.patientProfileId,
          occurredAt: now,
          recordedAt: now,
        },
        { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
      );

    const first = build(delivery!.options[0]!.professionalProfileId);
    const created = await repository.create(first.record, first.event);
    const retried = await repository.create(first.record, first.event);

    expect(retried.id).toBe(created.id);

    const { data: events } = await scenario.service
      .from("connection_events")
      .select("id")
      .eq("connection_id", created.id);
    expect(events, "retry não pode criar segundo evento inicial").toHaveLength(1);
  });

  it("duas escolhas concorrentes produzem uma única Connection", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const repository = new SupabaseConnectionRepository(scenario.patientClient);
    const now = new Date().toISOString();

    const build = (professionalProfileId: string) =>
      createConnection(
        {
          caseId: scenario.caseId,
          anchor: delivery!.anchor,
          patientProfileId: scenario.patientProfileId,
          professionalProfileId,
          actorId: scenario.patientProfileId,
          occurredAt: now,
          recordedAt: now,
        },
        { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
      );

    // Profissionais diferentes: só uma decisão pode vencer.
    const a = build(delivery!.options[0]!.professionalProfileId);
    const b = build(delivery!.options[1]!.professionalProfileId);

    const settled = await Promise.allSettled([
      repository.create(a.record, a.event),
      repository.create(b.record, b.event),
    ]);

    expect(settled.every((r) => r.status === "fulfilled")).toBe(true);

    const { data: rows } = await scenario.service
      .from("connection_records")
      .select("id")
      .eq("case_id", scenario.caseId);
    expect(rows, "concorrência não pode criar segunda Connection").toHaveLength(1);

    const { data: events } = await scenario.service
      .from("connection_events")
      .select("id")
      .eq("connection_id", rows![0]!.id);
    expect(events).toHaveLength(1);
  });

  it("recusa profissional fora das três opções entregues", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const now = new Date().toISOString();

    // Passa pela validação de domínio declarando-o elegível de mentira: quem
    // precisa recusar aqui é o banco, não a camada que o cliente controla.
    const forjado = createConnection(
      {
        caseId: scenario.caseId,
        anchor: delivery!.anchor,
        patientProfileId: scenario.patientProfileId,
        professionalProfileId: scenario.professionalIds[0]!,
        actorId: scenario.patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: [scenario.professionalIds[0]!] },
    );

    const { data: outro } = await scenario.service
      .from("professional_profiles")
      .select("id")
      .not("id", "in", `(${scenario.professionalIds.join(",")})`)
      .limit(1)
      .maybeSingle();

    if (!outro) return;

    const repository = new SupabaseConnectionRepository(scenario.patientClient);
    await expect(
      repository.create(
        { ...forjado.record, professionalProfileId: outro.id as string },
        forjado.event,
      ),
    ).rejects.toThrow();
  });

  it("outro paciente não lê nem cria nada deste Case", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const repository = new SupabaseConnectionRepository(scenario.patientClient);
    const now = new Date().toISOString();
    const escolha = createConnection(
      {
        caseId: scenario.caseId,
        anchor: delivery!.anchor,
        patientProfileId: scenario.patientProfileId,
        professionalProfileId: delivery!.options[0]!.professionalProfileId,
        actorId: scenario.patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
    );
    await repository.create(escolha.record, escolha.event);

    // Um segundo paciente, sem nenhum vínculo com este Case.
    const email = uniqueEmail("intruso");
    const intruso = await createPatientAccount(
      scenario.service,
      scenario.admin.client,
      { email, displayName: "Outro Paciente" },
      scenario.admin.userId,
    );
    createdPatientProfileIds.push(intruso.profileId);
    const intrusoClient = createCuradoriaClient(url, anonKey);
    await intrusoClient.auth.signInWithPassword({ email, password: intruso.password });

    // Não alcança a entrega.
    expect(await findDeliveredCuradoria(intrusoClient, scenario.caseId)).toBeNull();
    expect(await loadPatientCuradoria(intrusoClient)).toBeNull();

    // Não alcança a Connection.
    expect(await new SupabaseConnectionRepository(intrusoClient).findByCaseId(scenario.caseId)).toBeNull();

    // Não consegue criar uma para si a partir do Relatório alheio.
    const { error } = await intrusoClient.rpc("create_connection_from_report", {
      p_report_id: scenario.reportId,
      p_professional_profile_id: delivery!.options[0]!.professionalProfileId,
      p_decided_at: now,
      p_actor_id: intruso.profileId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(error, "outro paciente não pode criar Connection sobre Case alheio").not.toBeNull();
  });

  it("o Curador do Case lê, mas não escolhe pelo paciente", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const now = new Date().toISOString();

    const { error } = await scenario.curador.client.rpc("create_connection_from_report", {
      p_report_id: scenario.reportId,
      p_professional_profile_id: delivery!.options[0]!.professionalProfileId,
      p_decided_at: now,
      p_actor_id: scenario.curador.userId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });

    expect(error, "o Curador nunca registra a escolha no lugar da pessoa").not.toBeNull();
  });

  it("o quadro projeta o Case canônico como entregue, sem nenhuma linha do motor antigo", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    // Antes do repasse, quem enxerga o Case no quadro é quem tem vínculo — aqui
    // o administrador. É este o estágio que a projeção precisava reconhecer e
    // não reconhecia: entrega canônica virava "não entregue".
    const visto = await getCaseById(scenario.admin.client, scenario.caseId);

    expect(visto, "o Case entregue precisa aparecer no quadro").toBeTruthy();
    expect(visto!.pipelineStage).toBe("report_delivered");

    // E o estágio veio da entrega canônica: não existe linha legada nenhuma.
    const { data: legado } = await scenario.service
      .from("final_curadoria_deliveries")
      .select("id")
      .eq("case_id", scenario.caseId);
    expect(legado ?? []).toHaveLength(0);
  });

  // O repasse de responsabilidade ao Concierge passa por `cases_responsibility_guard`,
  // que recusa escrita direta — tem caminho próprio, fora do alcance desta
  // certificação. O que se prova aqui é o que não depende dele: sem vínculo
  // ninguém alcança o Case, e nem o Concierge nem qualquer outro papel troca a
  // escolha da pessoa.
  it("a escolha do paciente é dele, e sem vínculo ninguém alcança o Case", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const now = new Date().toISOString();
    const escolha = createConnection(
      {
        caseId: scenario.caseId,
        anchor: delivery!.anchor,
        patientProfileId: scenario.patientProfileId,
        professionalProfileId: delivery!.options[0]!.professionalProfileId,
        actorId: scenario.patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
    );
    await new SupabaseConnectionRepository(scenario.patientClient).create(escolha.record, escolha.event);

    // Quem não tem vínculo com o Case não o alcança, ainda que seja da equipe:
    // a RLS de `cases` autoriza por vínculo (responsável, Curador designado,
    // administrador), nunca por papel isolado.
    const concierge = await loginAs("concierge");
    expect(await getCaseById(concierge.client, scenario.caseId)).toBeNull();

    const atendente = await loginAs("atendente");
    expect(await getCaseById(atendente.client, scenario.caseId)).toBeNull();

    // O Concierge acompanha; a escolha continua sendo da pessoa.
    const { error } = await concierge.client.rpc("create_connection_from_report", {
      p_report_id: scenario.reportId,
      p_professional_profile_id: delivery!.options[1]!.professionalProfileId,
      p_decided_at: now,
      p_actor_id: concierge.userId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(error, "o Concierge nunca troca a escolha do paciente").not.toBeNull();

    const { data: rows } = await scenario.service
      .from("connection_records")
      .select("professional_profile_id")
      .eq("case_id", scenario.caseId);
    expect(rows).toHaveLength(1);
    expect(rows![0]!.professional_profile_id).toBe(delivery!.options[0]!.professionalProfileId);
  });

  it("o Case é repassado ao Concierge pelo caminho oficial, e ele acompanha sem P010", async () => {
    const scenario = await deliveredCanonicalCase();
    if (!scenario) return;

    // A pessoa escolhe. Connection canônica.
    const delivery = await findDeliveredCuradoria(scenario.patientClient, scenario.caseId);
    const now = new Date().toISOString();
    const escolha = createConnection(
      {
        caseId: scenario.caseId,
        anchor: delivery!.anchor,
        patientProfileId: scenario.patientProfileId,
        professionalProfileId: delivery!.options[0]!.professionalProfileId,
        actorId: scenario.patientProfileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: delivery!.options.map((o) => o.professionalProfileId) },
    );
    await new SupabaseConnectionRepository(scenario.patientClient).create(escolha.record, escolha.event);

    const concierge = await loginAs("concierge");

    // ---- REPASSE pelo caminho oficial, com sessão autenticada do administrador.
    const { error: transferError } = await scenario.admin.client
      .schema("curadoria")
      .rpc("transfer_case_responsibility", {
        _case_id: scenario.caseId,
        _new_responsible_id: concierge.userId,
        _new_role: "concierge",
        _reason: "Curadoria entregue e escolha registrada — segue para acompanhamento.",
      });
    expect(transferError, "o repasse oficial precisa ser aceito").toBeNull();

    // Responsabilidade posterior + histórico append-only.
    const { data: caseRow } = await scenario.service
      .from("cases")
      .select("responsible_id, responsible_role")
      .eq("id", scenario.caseId)
      .single();
    expect(caseRow!.responsible_id).toBe(concierge.userId);
    expect(caseRow!.responsible_role).toBe("concierge");

    // O histórico em `case_responsibility_changes` é append-only e nega SELECT
    // até ao service role — só a função SECURITY DEFINER escreve nele. Por isso
    // ele é auditado fora daqui, direto no banco, e não por este cliente.

    // ---- O Concierge responsável enxerga o Case, no estágio da entrega canônica.
    const visto = await getCaseById(concierge.client, scenario.caseId);
    expect(visto, "o Concierge responsável precisa alcançar o Case").toBeTruthy();

    // O Concierge enxerga o FATO da entrega sem enxergar o conteúdo: o estágio
    // é o do acompanhamento, e o Relatório continua fora do alcance dele.
    expect(visto!.pipelineStage).toBe("scheduling_support");
    expect(
      await findDeliveredCuradoria(concierge.client, scenario.caseId),
      "saber que houve entrega não pode dar acesso às três opções",
    ).toBeNull();

    // ---- Uma ação real de acompanhamento: combinar o primeiro atendimento.
    const { contactId } = await createContact(
      concierge.client,
      {
        fullName: "Paciente Connection Canônica",
        source: "indicacao",
        priority: "media",
        consentStatus: "pendente",
      },
      concierge.userId,
    );
    const task = await createTask(
      concierge.client,
      {
        contactId,
        caseId: scenario.caseId,
        title: "Combinar o primeiro atendimento",
        type: "retorno",
        priority: "media",
      },
      concierge.userId,
    );

    const { data: persistida } = await scenario.service
      .from("crm_tasks")
      .select("id, case_id, assigned_to")
      .eq("id", task.id)
      .single();
    expect(persistida!.case_id, "a ação do Concierge precisa persistir ligada ao Case").toBe(
      scenario.caseId,
    );
    expect(persistida!.assigned_to).toBe(concierge.userId);

    // ---- Quem não tem vínculo não alcança o Case.
    const atendente = await loginAs("atendente");
    expect(await getCaseById(atendente.client, scenario.caseId)).toBeNull();

    // ---- O Concierge acompanha; a escolha continua sendo da pessoa.
    const { error: trocaError } = await concierge.client.rpc("create_connection_from_report", {
      p_report_id: scenario.reportId,
      p_professional_profile_id: delivery!.options[1]!.professionalProfileId,
      p_decided_at: now,
      p_actor_id: concierge.userId,
      p_event_payload: {},
      p_occurred_at: now,
      p_recorded_at: now,
    });
    expect(trocaError, "o Concierge nunca troca a escolha do paciente").not.toBeNull();

    const { data: connections } = await scenario.service
      .from("connection_records")
      .select("professional_profile_id, curadoria_report_id, final_curadoria_delivery_id")
      .eq("case_id", scenario.caseId);
    expect(connections).toHaveLength(1);
    expect(connections![0]!.professional_profile_id).toBe(delivery!.options[0]!.professionalProfileId);
    expect(connections![0]!.curadoria_report_id).toBe(scenario.reportId);
    expect(connections![0]!.final_curadoria_delivery_id).toBeNull();

    // ---- Nenhuma escrita do motor antigo em todo o acompanhamento.
    for (const table of ["final_curadoria_deliveries", "human_review_results"]) {
      const { data } = await scenario.service.from(table).select("id").eq("case_id", scenario.caseId);
      expect(data ?? [], `${table} não pode receber linha`).toHaveLength(0);
    }
    const { data: execs } = await scenario.service
      .from("ace_executions")
      .select("id")
      .eq("case_id", scenario.caseId);
    expect(execs ?? []).toHaveLength(0);
  });

  it("um Relatório ainda não entregue não habilita escolha nenhuma", async () => {
    // "Emitido, não entregue" é CONSTRUÍDO, nunca revertido: o Bloco C
    // (20260802160000) tornou o carimbo de entrega definitivo — apagar
    // delivered_at via service era exatamente o ato que deixou de existir.
    const scenario = await deliveredCanonicalCase({ entregar: false });
    if (!scenario) return;

    expect(await findDeliveredCuradoria(scenario.patientClient, scenario.caseId)).toBeNull();

    // Pelo cliente do paciente, não pelo service role: as funções canônicas
    // deixaram de ser executáveis por PUBLIC (e, com isso, por `anon` e pelo
    // service role, que só as alcançavam por herança). `authenticated` é o
    // único papel de cliente autorizado — e é assim que a policy de INSERT e o
    // trigger de coerência as invocam em produção.
    const { data: ok } = await scenario.patientClient.rpc("canonical_delivery_matches", {
      p_report_id: scenario.reportId,
      p_case_id: scenario.caseId,
      p_patient_profile_id: scenario.patientProfileId,
    });
    expect(ok).toBe(false);
  });
});
