import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";

import { createCuradoriaClient } from "./curadoria-client";
import { seedPublishedProfessional } from "./rede-fixture";

/**
 * Incremento 1 da Continuidade Pós-Decisão — garantias de banco.
 *
 * Estes testes existiam como script psql ad hoc durante a implementação. Aqui
 * viram suíte permanente: o valor deles não é provar que funcionou uma vez, é
 * impedir que uma policy futura, escrita com pressa, devolva silenciosamente
 * ao Concierge o acesso que este incremento restringiu.
 *
 * Duas escolhas de método, ambas deliberadas:
 *
 *  - **Sem `session_replication_role = replica`.** O script ad hoc o usou para
 *    montar fixture rápido, desligando FKs. Aqui a fixture é real e passa
 *    pelas mesmas portas do produto, porque um teste de RLS que roda com o
 *    banco em modo réplica não prova o que a operação vive.
 *  - **Sem ID fixo e sem ordem entre testes.** Cada cenário monta e destrói o
 *    que criou; nada depende de quem rodou antes.
 */

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

describe("Continuidade Pós-Decisão — Incremento 1 (contact_mode, RLS e RPC)", () => {
  let accounts: TestAccount[];
  let adminUserId: string;

  beforeAll(async () => {
    accounts = loadTestAccounts();
    const admin = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: admin.email, password: admin.password });
    const { data } = await client.auth.getUser();
    adminUserId = data.user!.id;
  });

  // Tudo o que a rodada criou, para o teardown não depender de ordem.
  let createdProfileIds: string[] = [];
  let createdProfessionalIds: string[] = [];
  let createdCaseIds: string[] = [];

  afterEach(async () => {
    const admin = createAdminSupabaseClient();

    if (createdCaseIds.length > 0) {
      // Ordem explícita: o que aponta para o Case sai antes do Case, e o Case
      // antes dos profissionais. A cascata cobre connection_records e seus
      // eventos; o resto da cadeia da entrega precisa ser removido à mão.
      await admin.from("patient_curadoria_decisions").delete().in("case_id", createdCaseIds);
      await admin.from("curadoria_reports").delete().in("case_id", createdCaseIds);
      await admin.from("curated_selections").delete().in("case_id", createdCaseIds);
      await admin.from("priority_profiles").delete().in("case_id", createdCaseIds);

      // O Case sai pelo descarte administrativo autorizado, não por DELETE:
      // um Case que já trocou de responsável tem histórico em
      // `case_responsibility_changes`, e a ADR-038 proíbe apagá-lo por fora.
      // A fixture obedece à mesma regra que a operação obedece.
      for (const caseId of createdCaseIds) {
        const { error } = await admin.rpc("discard_case_admin", {
          _case_id: caseId,
          _reason: "Teardown da suíte de continuidade pós-decisão.",
          _executed_by: adminUserId,
        });
        if (error) throw new Error(`teardown: Case ${caseId} não descartado — ${error.message}`);
      }
      createdCaseIds = [];
    }

    if (createdProfileIds.length > 0) {
      await admin.from("cases").delete().in("patient_profile_id", createdProfileIds);
      await admin.from("patient_stories").delete().in("profile_id", createdProfileIds);
      await admin.from("patient_profiles").delete().in("profile_id", createdProfileIds);
      await admin.from("user_roles").delete().in("profile_id", createdProfileIds);
      for (const id of createdProfileIds) {
        await admin.auth.admin.deleteUser(id);
      }
      createdProfileIds = [];
    }

    if (createdProfessionalIds.length > 0) {
      const { error } = await admin
        .from("professional_profiles")
        .delete()
        .in("id", createdProfessionalIds);
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

  /**
   * Só existe UMA conta `concierge` no bootstrap, e estes testes precisam de
   * duas — a responsável e a que tem o papel sem ter o Case. A segunda é
   * criada aqui e destruída no teardown, em vez de alterar o bootstrap: o
   * cenário é desta suíte, não do ambiente.
   */
  async function createSecondConcierge() {
    const admin = createAdminSupabaseClient();
    const suffix = unique("conc2");
    const email = `${suffix}@aliviar-conexao.local`;
    const password = `Senha-${suffix}!`;

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Concierge Sem Vínculo" },
    });
    if (error || !created?.user) {
      throw new Error(`fixture: segundo Concierge não criado — ${error?.message}`);
    }
    createdProfileIds.push(created.user.id);

    const { data: role } = await admin
      .from("roles")
      .select("id")
      .eq("slug", "concierge")
      .single();
    await admin
      .from("user_roles")
      .insert({ profile_id: created.user.id, role_id: role!.id });

    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email, password });
    return { client, userId: created.user.id };
  }

  /**
   * Cenário mínimo e suficiente: um Case com paciente, Curador designado e uma
   * Connection já decidida.
   *
   * Não passa pela Curadoria inteira de propósito — o que está sob teste é a
   * autorização sobre `connection_records`/`connection_events`, e construir
   * Relatório, seleção e entrega só para chegar aqui tornaria a suíte lenta e
   * frágil por motivos alheios ao que ela protege. A Connection é inserida
   * pelo cliente de serviço, com FKs reais e triggers ativos.
   */
  async function seedDecidedCase(opts: { withAssignedCurator?: boolean } = {}) {
    const withAssignedCurator = opts.withAssignedCurator ?? true;
    const admin = createAdminSupabaseClient();
    const curador = await loginAs("curador_medico");

    const suffix = unique("paciente");
    const email = `${suffix}@aliviar-conexao.local`;
    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password: `Senha-${suffix}!`,
      email_confirm: true,
      user_metadata: { display_name: "Paciente Continuidade" },
    });
    if (userError || !created?.user) {
      throw new Error(`fixture: paciente não criada — ${userError?.message}`);
    }
    const patientId = created.user.id;
    createdProfileIds.push(patientId);

    const { data: pacienteRole } = await admin
      .from("roles")
      .select("id")
      .eq("slug", "paciente")
      .single();
    await admin.from("user_roles").insert({ profile_id: patientId, role_id: pacienteRole!.id });

    const { data: story, error: storyError } = await admin
      .from("patient_stories")
      .insert({
        profile_id: patientId,
        status: "enviada",
        current_step: "revisao",
        data: { motivo: "Fixture da continuidade." },
        created_by: patientId,
      })
      .select("id")
      .single();
    if (storyError) throw new Error(`fixture: história — ${storyError.message}`);

    const { data: caseRow, error: caseError } = await admin
      .from("cases")
      .insert({
        patient_profile_id: patientId,
        source_story_id: story!.id,
        created_by: curador.userId,
        assigned_curator_id: withAssignedCurator ? curador.userId : null,
        responsible_id: curador.userId,
        responsible_role: "curador_medico",
      })
      .select("id")
      .single();
    if (caseError) throw new Error(`fixture: Case — ${caseError.message}`);
    createdCaseIds.push(caseRow!.id as string);

    // TRÊS profissionais, não um. O banco recusa Relatório com outro número:
    // "o Relatório apresenta sempre exatamente três opções". A fixture obedece
    // ao Método em vez de contorná-lo — a paciente escolhe o primeiro.
    const adminSession = await loginAs("administrador");
    const professionalIds: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const id = await seedPublishedProfessional(
        admin,
        adminSession.userId,
        `Profissional Continuidade ${i + 1}`,
      );
      professionalIds.push(id);
      createdProfessionalIds.push(id);
    }
    const professional = { id: professionalIds[0] };

    // A âncora canônica precisa existir de verdade: o trigger
    // `assert_connection_professional_in_delivery` exige um Relatório emitido
    // e entregue, cuja seleção também esteja entregue, com o profissional
    // entre as opções. Montamos a cadeia mínima que satisfaz essa regra em vez
    // de contorná-la — é ela que garante que ninguém escolha fora dos três.
    const agora = new Date().toISOString();

    const { data: profile, error: profileError } = await admin
      .from("priority_profiles")
      .insert({ case_id: caseRow!.id, curator_id: curador.userId, status: "DRAFT" })
      .select("id")
      .single();
    if (profileError) throw new Error(`fixture: Perfil — ${profileError.message}`);

    // Bloco C (gate C7): seleção não nasce entregue. Ela nasce DRAFT, ganha
    // as opções e o Relatório emitido, e a entrega acontece como TRANSIÇÃO
    // (o mesmo UPDATE que deliver_curadoria executa) — logo abaixo, depois
    // da emissão.
    const { data: selection, error: selError } = await admin
      .from("curated_selections")
      .insert({
        case_id: caseRow!.id,
        priority_profile_id: profile!.id,
        selected_by: curador.userId,
        composition_rationale: "Fixture da continuidade.",
      })
      .select("id")
      .single();
    if (selError) throw new Error(`fixture: seleção — ${selError.message}`);

    const { data: options, error: optionsError } = await admin
      .from("curated_selection_options")
      .insert(
        professionalIds.map((id, index) => ({
          curated_selection_id: selection!.id,
          professional_profile_id: id,
          position: index + 1,
          rationale: "Entra porque atende o que ela pediu.",
        })),
      )
      .select("id, professional_profile_id");
    if (optionsError) throw new Error(`fixture: opções — ${optionsError.message}`);

    // O Relatório nasce em rascunho: uma vez emitido ele é documento
    // congelado, e as opções não entram mais. A ordem aqui é a mesma do
    // produto — escrever, depois emitir.
    const { data: report, error: reportError } = await admin
      .from("curadoria_reports")
      .insert({ case_id: caseRow!.id, curated_selection_id: selection!.id })
      .select("id")
      .single();
    if (reportError) throw new Error(`fixture: Relatório — ${reportError.message}`);

    const { error: optionError } = await admin.from("curadoria_report_options").insert(
      professionalIds.map((id, index) => ({
        report_id: report!.id,
        professional_profile_id: id,
        position: index + 1,
        justification: "Responde ao critério que ela nomeou.",
        relation_to_weights: "Cobre o que ela pesou mais.",
        attention_points: ["Agenda mais concorrida."],
      })),
    );
    if (optionError) throw new Error(`fixture: opção do Relatório — ${optionError.message}`);

    // Aprovar antes de emitir: o banco recusa transformar rascunho em
    // documento sem autoria humana registrada. A fixture respeita a regra em
    // vez de contorná-la.
    const { error: approveError } = await admin
      .from("curadoria_reports")
      .update({ approved_at: agora, approved_by: curador.userId })
      .eq("id", report!.id);
    if (approveError) throw new Error(`fixture: aprovação — ${approveError.message}`);

    const { error: emitError } = await admin
      .from("curadoria_reports")
      .update({ emitted_at: agora })
      .eq("id", report!.id);
    if (emitError) throw new Error(`fixture: emissão do Relatório — ${emitError.message}`);

    // A entrega como transição: primeiro a seleção (gate B12 exige o
    // Relatório emitido acima), depois o Relatório (gate B17 exige a seleção
    // já DELIVERED) — a mesma ordem de deliver_curadoria.
    const { error: selDeliverError } = await admin
      .from("curated_selections")
      .update({ status: "DELIVERED", delivered_at: agora })
      .eq("id", selection!.id);
    if (selDeliverError) throw new Error(`fixture: entrega da seleção — ${selDeliverError.message}`);

    const { error: deliverError } = await admin
      .from("curadoria_reports")
      .update({ delivered_at: agora })
      .eq("id", report!.id);
    if (deliverError) throw new Error(`fixture: entrega do Relatório — ${deliverError.message}`);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({
      email,
      password: `Senha-${suffix}!`,
    });

    // A decisão é criada PELA PACIENTE, pelo mesmo RPC transacional do
    // produto. Não é preciosismo: as funções de guarda da entrega canônica
    // são concedidas a `authenticated`, e o cliente de serviço nem sequer
    // consegue executá-las — o caminho real é o único que funciona, e é o
    // que queremos exercitar.
    const { data: connection, error: connError } = await patientClient.rpc(
      "create_connection_from_report",
      {
        p_report_id: report!.id,
        p_professional_profile_id: professional.id,
        p_decided_at: agora,
        p_actor_id: patientId,
        p_event_payload: { professionalProfileId: professional.id },
        p_occurred_at: agora,
        p_recorded_at: agora,
      },
    );
    if (connError) throw new Error(`fixture: Connection — ${connError.message}`);

    return {
      admin,
      curador,
      caseId: caseRow!.id as string,
      connectionId: connection!.id as string,
      connection: connection!,
      patientId,
      patientClient,
      selectionId: selection!.id as string,
      chosenOptionId: options!.find((o) => o.professional_profile_id === professional.id)!.id as string,
    };
  }

  /**
   * A transferência passa pela função auditada real, executada pelo Curador
   * responsável — não por um `update` direto. É ela quem exige ator
   * autenticado, valida o papel do destinatário e grava o motivo; testar o
   * acesso sobre um atalho provaria menos do que o produto faz.
   */
  async function transferirPara(
    curador: { client: ReturnType<typeof createCuradoriaClient> },
    caseId: string,
    novoResponsavelId: string,
  ) {
    const { error } = await curador.client
      .schema("curadoria")
      .rpc("transfer_case_responsibility", {
        _case_id: caseId,
        _new_responsible_id: novoResponsavelId,
        _new_role: "concierge",
        _reason: "Curadoria entregue; continuidade assumida.",
      });
    if (error) {
      throw new Error(`fixture: transferência recusada — ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------
  // contact_mode — coluna, constraint e legado
  // ---------------------------------------------------------------------

  it("contact_mode nasce null — legado e ausência de escolha permanecem verdadeiros", async () => {
    const fixture = await seedDecidedCase();
    expect(fixture.connection.contact_mode).toBeNull();
  });

  it("aceita CONTATO_DIRETO_ACOMPANHADO", async () => {
    const fixture = await seedDecidedCase();
    const { error } = await fixture.admin
      .from("connection_records")
      .update({ contact_mode: "CONTATO_DIRETO_ACOMPANHADO" })
      .eq("id", fixture.connectionId);
    expect(error).toBeNull();
  });

  it("aceita APROXIMACAO_INTERMEDIADA", async () => {
    const fixture = await seedDecidedCase();
    const { error } = await fixture.admin
      .from("connection_records")
      .update({ contact_mode: "APROXIMACAO_INTERMEDIADA" })
      .eq("id", fixture.connectionId);
    expect(error).toBeNull();
  });

  it("[NEGATIVO] rejeita modo inválido — nenhum valor fora dos dois canônicos entra", async () => {
    const fixture = await seedDecidedCase();
    const { error } = await fixture.admin
      .from("connection_records")
      .update({ contact_mode: "DIRETO" })
      .eq("id", fixture.connectionId);

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/contact_mode/i);
  });

  // ---------------------------------------------------------------------
  // RLS — quem lê a decisão
  // ---------------------------------------------------------------------

  it("a paciente proprietária lê o próprio connection_records", async () => {
    const fixture = await seedDecidedCase();
    const { data } = await fixture.patientClient
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);

    expect(data).toHaveLength(1);
  });

  it("o Concierge responsável lê connection_records e connection_events", async () => {
    const fixture = await seedDecidedCase();
    const concierge = await loginAs("concierge");
    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    const { data: records } = await concierge.client
      .from("connection_records")
      .select("id, contact_mode, status")
      .eq("id", fixture.connectionId);
    const { data: events } = await concierge.client
      .from("connection_events")
      .select("id")
      .eq("connection_id", fixture.connectionId);

    expect(records).toHaveLength(1);
    expect(events!.length).toBeGreaterThanOrEqual(1);
  });

  it("[NEGATIVO] Concierge com o papel, mas sem responsabilidade pelo Case, NÃO lê connection_records", async () => {
    const fixture = await seedDecidedCase();
    const outro = await createSecondConcierge();

    const { data } = await outro.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);

    expect(data).toHaveLength(0);
  });

  it("[NEGATIVO] Concierge com o papel, mas sem responsabilidade pelo Case, NÃO lê connection_events", async () => {
    const fixture = await seedDecidedCase();
    const outro = await createSecondConcierge();

    const { data } = await outro.client
      .from("connection_events")
      .select("id")
      .eq("connection_id", fixture.connectionId);

    expect(data).toHaveLength(0);
  });

  it("o Curador designado mantém o acesso previsto por can_access_case", async () => {
    const fixture = await seedDecidedCase();
    const concierge = await loginAs("concierge");
    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    // Mesmo depois de entregar a responsabilidade, o Curador designado
    // continua alcançável para dúvidas sobre o caso (A_DECISAO §7).
    const { data } = await fixture.curador.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);

    expect(data).toHaveLength(1);
  });

  it("[NEGATIVO] o ex-responsável perde o acesso quando entrega o Case", async () => {
    // Sem Curador designado: aqui o Curador é o responsável ATUAL e nada mais.
    // É o cenário que expõe a regra que `can_access_case` documenta — "quem já
    // entregou o Case não continua enxergando". Com `assigned_curator_id`
    // preenchido o vínculo histórico o manteria, e o teste não provaria nada.
    const fixture = await seedDecidedCase({ withAssignedCurator: false });

    const antes = await fixture.curador.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);
    expect(antes.data).toHaveLength(1);

    const concierge = await loginAs("concierge");
    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    const depois = await fixture.curador.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);
    expect(depois.data).toHaveLength(0);
  });

  it("o novo responsável ganha o acesso na transferência, sem nenhum passo extra", async () => {
    const fixture = await seedDecidedCase();
    const concierge = await loginAs("concierge");

    const antes = await concierge.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);
    expect(antes.data).toHaveLength(0);

    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    const depois = await concierge.client
      .from("connection_records")
      .select("id")
      .eq("id", fixture.connectionId);
    expect(depois.data).toHaveLength(1);
  });

  // ---------------------------------------------------------------------
  // A formulação do trade-off permanece fora do alcance do Concierge
  // ---------------------------------------------------------------------

  async function seedDecision(fixture: Awaited<ReturnType<typeof seedDecidedCase>>) {
    await fixture.admin.from("patient_curadoria_decisions").insert({
      case_id: fixture.caseId,
      curated_selection_id: fixture.selectionId,
      outcome: "CHOSEN",
      chosen_option_id: fixture.chosenOptionId,
      note: "escolhi porque ele falou em me acompanhar depois",
    });
  }

  it("a paciente lê a própria formulação do trade-off", async () => {
    const fixture = await seedDecidedCase();
    await seedDecision(fixture);

    const { data } = await fixture.patientClient
      .from("patient_curadoria_decisions")
      .select("note")
      .eq("case_id", fixture.caseId);

    expect(data).toHaveLength(1);
    expect(data![0].note).toContain("me acompanhar depois");
  });

  it("o Curador do caso lê a formulação, conforme a policy vigente", async () => {
    const fixture = await seedDecidedCase();
    await seedDecision(fixture);

    const { data } = await fixture.curador.client
      .from("patient_curadoria_decisions")
      .select("note")
      .eq("case_id", fixture.caseId);

    expect(data).toHaveLength(1);
  });

  it("[NEGATIVO] o Concierge responsável NÃO lê a formulação do trade-off", async () => {
    const fixture = await seedDecidedCase();
    await seedDecision(fixture);
    const concierge = await loginAs("concierge");
    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    // Ele responde pelo Case e enxerga a Connection — e ainda assim a frase
    // dela permanece fora do alcance. A invisibilidade não vem de uma regra
    // escrita para escondê-la: vem de nunca termos ampliado esse acesso.
    const { data } = await concierge.client
      .from("patient_curadoria_decisions")
      .select("note")
      .eq("case_id", fixture.caseId);

    expect(data).toHaveLength(0);
  });

  // ---------------------------------------------------------------------
  // As novas policies não ampliam escrita
  // ---------------------------------------------------------------------

  it("[NEGATIVO] o Concierge responsável NÃO atualiza connection_records", async () => {
    const fixture = await seedDecidedCase();
    const concierge = await loginAs("concierge");
    await transferirPara(fixture.curador, fixture.caseId, concierge.userId);

    await concierge.client
      .from("connection_records")
      .update({ status: "CONTATO_INICIADO" })
      .eq("id", fixture.connectionId);

    const { data } = await fixture.admin
      .from("connection_records")
      .select("status")
      .eq("id", fixture.connectionId)
      .single();

    expect(data!.status).toBe("DECISAO_REGISTRADA");
  });

  // ---------------------------------------------------------------------
  // RPC set_connection_contact_mode
  // ---------------------------------------------------------------------

  it("define o modo e grava o evento na mesma transação, sem alterar o status", async () => {
    const fixture = await seedDecidedCase();
    const repo = new SupabaseConnectionRepository(fixture.patientClient);

    const record = await repo.setContactMode(
      fixture.connectionId,
      null,
      "APROXIMACAO_INTERMEDIADA",
      {
        eventType: "MODO_CONTATO_DEFINIDO",
        actorId: fixture.patientId,
        payload: { previousMode: null, contactMode: "APROXIMACAO_INTERMEDIADA" },
        occurredAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
      },
    );

    expect(record.contactMode).toBe("APROXIMACAO_INTERMEDIADA");
    expect(record.status).toBe("DECISAO_REGISTRADA");

    const { data: events } = await fixture.admin
      .from("connection_events")
      .select("id")
      .eq("connection_id", fixture.connectionId)
      .eq("event_type", "MODO_CONTATO_DEFINIDO");
    expect(events).toHaveLength(1);
  });

  it("é idempotente: repetir o mesmo modo não cria evento novo", async () => {
    const fixture = await seedDecidedCase();
    const repo = new SupabaseConnectionRepository(fixture.patientClient);
    const event = {
      eventType: "MODO_CONTATO_DEFINIDO" as const,
      actorId: fixture.patientId,
      payload: {},
      occurredAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    await repo.setContactMode(fixture.connectionId, null, "CONTATO_DIRETO_ACOMPANHADO", event);
    await repo.setContactMode(
      fixture.connectionId,
      "CONTATO_DIRETO_ACOMPANHADO",
      "CONTATO_DIRETO_ACOMPANHADO",
      event,
    );

    const { data: events } = await fixture.admin
      .from("connection_events")
      .select("id")
      .eq("connection_id", fixture.connectionId)
      .eq("event_type", "MODO_CONTATO_DEFINIDO");
    expect(events).toHaveLength(1);
  });

  it("[NEGATIVO] recusa concorrência obsoleta — expectedMode desatualizado não passa", async () => {
    const fixture = await seedDecidedCase();
    const repo = new SupabaseConnectionRepository(fixture.patientClient);
    const event = {
      eventType: "MODO_CONTATO_DEFINIDO" as const,
      actorId: fixture.patientId,
      payload: {},
      occurredAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    };

    await repo.setContactMode(fixture.connectionId, null, "APROXIMACAO_INTERMEDIADA", event);

    await expect(
      repo.setContactMode(fixture.connectionId, null, "CONTATO_DIRETO_ACOMPANHADO", event),
    ).rejects.toMatchObject({ code: "CONCURRENT_CONFLICT" });
  });

  it("[NEGATIVO] recusa definir o modo depois de CONTATO_INICIADO — o modo vira história", async () => {
    const fixture = await seedDecidedCase();
    const repo = new SupabaseConnectionRepository(fixture.patientClient);

    await fixture.admin
      .from("connection_records")
      .update({ status: "CONTATO_INICIADO" })
      .eq("id", fixture.connectionId);

    await expect(
      repo.setContactMode(fixture.connectionId, null, "CONTATO_DIRETO_ACOMPANHADO", {
        eventType: "MODO_CONTATO_DEFINIDO",
        actorId: fixture.patientId,
        payload: {},
        occurredAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
      }),
    ).rejects.toMatchObject({ code: "CONTACT_MODE_NOT_ALLOWED" });
  });
});
