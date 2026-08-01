import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SupabaseApproachRepository } from "@/modules/connection/approach-repository";

import { createCuradoriaClient } from "./curadoria-client";
import { seedPublishedProfessional } from "./rede-fixture";

/**
 * Incremento 2 — tentativas de aproximação e notificação interna.
 *
 * A propriedade que esta suíte existe para proteger, e que nenhuma refatoração
 * futura pode quebrar em silêncio:
 *
 *   Transferir o Case muda quem enxerga e responde;
 *   NÃO reescreve a história da tentativa nem da notificação.
 *
 * Fixture real, sem `session_replication_role`, sem IDs fixos, sem dependência
 * de ordem — mesmo padrão da suíte do Incremento 1.
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

describe("Continuidade Pós-Decisão — Incremento 2 (tentativas e notificações)", () => {
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

  let createdProfileIds: string[] = [];
  let createdProfessionalIds: string[] = [];
  let createdCaseIds: string[] = [];

  afterEach(async () => {
    const admin = createAdminSupabaseClient();

    if (createdCaseIds.length > 0) {
      await admin.from("team_notifications").delete().in("case_id", createdCaseIds);
      await admin.from("approach_attempts").delete().in("case_id", createdCaseIds);
      await admin.from("patient_curadoria_decisions").delete().in("case_id", createdCaseIds);
      await admin.from("curadoria_reports").delete().in("case_id", createdCaseIds);
      await admin.from("curated_selections").delete().in("case_id", createdCaseIds);
      await admin.from("priority_profiles").delete().in("case_id", createdCaseIds);
      for (const caseId of createdCaseIds) {
        const { error } = await admin.rpc("discard_case_admin", {
          _case_id: caseId,
          _reason: "Teardown da suíte de tentativas de aproximação.",
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
      for (const id of createdProfileIds) await admin.auth.admin.deleteUser(id);
      createdProfileIds = [];
    }

    if (createdProfessionalIds.length > 0) {
      const { error } = await admin
        .from("professional_profiles")
        .delete()
        .in("id", createdProfessionalIds);
      if (error) throw new Error(`teardown: profissionais não removidos — ${error.message}`);
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
    const { data } = await client.auth.getUser();
    return { client, userId: data.user!.id };
  }

  /** Segundo Concierge: tem o papel, não tem o Case. */
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
    if (error || !created?.user) throw new Error(`fixture: 2º Concierge — ${error?.message}`);
    createdProfileIds.push(created.user.id);

    const { data: role } = await admin.from("roles").select("id").eq("slug", "concierge").single();
    await admin.from("user_roles").insert({ profile_id: created.user.id, role_id: role!.id });

    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email, password });
    return { client, userId: created.user.id };
  }

  async function transferirPara(
    curador: { client: ReturnType<typeof createCuradoriaClient> },
    caseId: string,
    novoResponsavelId: string,
  ) {
    const { error } = await curador.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: caseId,
      _new_responsible_id: novoResponsavelId,
      _new_role: "concierge",
      _reason: "Curadoria entregue; continuidade assumida.",
    });
    if (error) throw new Error(`fixture: transferência recusada — ${error.message}`);
  }

  /**
   * Case decidido, com modo definido pela paciente e responsabilidade já com o
   * Concierge — o cenário em que a tentativa existe.
   */
  async function seedIntermediado(
    opts: { mode?: "APROXIMACAO_INTERMEDIADA" | "CONTATO_DIRETO_ACOMPANHADO" } = {},
  ) {
    const mode = opts.mode ?? "APROXIMACAO_INTERMEDIADA";
    const admin = createAdminSupabaseClient();
    const curador = await loginAs("curador_medico");
    const agora = new Date().toISOString();
    const suffix = unique("paciente");
    const email = `${suffix}@aliviar-conexao.local`;
    const password = `Senha-${suffix}!`;

    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Paciente Continuidade" },
    });
    if (userError || !created?.user) throw new Error(`fixture: paciente — ${userError?.message}`);
    const patientId = created.user.id;
    createdProfileIds.push(patientId);

    const { data: pacienteRole } = await admin
      .from("roles")
      .select("id")
      .eq("slug", "paciente")
      .single();
    await admin.from("user_roles").insert({ profile_id: patientId, role_id: pacienteRole!.id });

    const { data: story } = await admin
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

    const { data: caseRow, error: caseError } = await admin
      .from("cases")
      .insert({
        patient_profile_id: patientId,
        source_story_id: story!.id,
        created_by: curador.userId,
        assigned_curator_id: curador.userId,
        responsible_id: curador.userId,
        responsible_role: "curador_medico",
      })
      .select("id")
      .single();
    if (caseError) throw new Error(`fixture: Case — ${caseError.message}`);
    createdCaseIds.push(caseRow!.id as string);

    const adminSession = await loginAs("administrador");
    const professionalIds: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const id = await seedPublishedProfessional(admin, adminSession.userId, `Prof ${i + 1}`);
      professionalIds.push(id);
      createdProfessionalIds.push(id);
    }

    const { data: profile } = await admin
      .from("priority_profiles")
      .insert({ case_id: caseRow!.id, curator_id: curador.userId, status: "DRAFT" })
      .select("id")
      .single();

    const { data: selection } = await admin
      .from("curated_selections")
      .insert({
        case_id: caseRow!.id,
        priority_profile_id: profile!.id,
        selected_by: curador.userId,
        composition_rationale: "Fixture.",
        status: "DELIVERED",
        delivered_at: agora,
      })
      .select("id")
      .single();

    const { data: report } = await admin
      .from("curadoria_reports")
      .insert({ case_id: caseRow!.id, curated_selection_id: selection!.id })
      .select("id")
      .single();

    await admin.from("curadoria_report_options").insert(
      professionalIds.map((id, index) => ({
        report_id: report!.id,
        professional_profile_id: id,
        position: index + 1,
        justification: "Responde ao critério que ela nomeou.",
        relation_to_weights: "Cobre o que ela pesou mais.",
        attention_points: ["Agenda mais concorrida."],
      })),
    );
    await admin
      .from("curadoria_reports")
      .update({ approved_at: agora, approved_by: curador.userId })
      .eq("id", report!.id);
    await admin.from("curadoria_reports").update({ emitted_at: agora }).eq("id", report!.id);
    await admin.from("curadoria_reports").update({ delivered_at: agora }).eq("id", report!.id);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password });

    const { data: connection, error: connError } = await patientClient.rpc(
      "create_connection_from_report",
      {
        p_report_id: report!.id,
        p_professional_profile_id: professionalIds[0],
        p_decided_at: agora,
        p_actor_id: patientId,
        p_event_payload: { professionalProfileId: professionalIds[0] },
        p_occurred_at: agora,
        p_recorded_at: agora,
      },
    );
    if (connError) throw new Error(`fixture: Connection — ${connError.message}`);

    // O modo é declarado pela paciente, pelo caminho real do Incremento 1.
    await patientClient.rpc("set_connection_contact_mode", {
      p_connection_id: connection!.id,
      p_expected_mode: null,
      p_new_mode: mode,
      p_actor_id: patientId,
      p_occurred_at: agora,
      p_recorded_at: agora,
    });

    const concierge = await loginAs("concierge");
    await transferirPara(curador, caseRow!.id as string, concierge.userId);

    return {
      admin,
      curador,
      concierge,
      patientClient,
      patientId,
      caseId: caseRow!.id as string,
      connectionId: connection!.id as string,
      professionalIds,
    };
  }

  const now = () => new Date().toISOString();

  // -------------------------------------------------------------------------
  // approach_attempts
  // -------------------------------------------------------------------------

  it("o Concierge responsável cria uma tentativa válida", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);

    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());

    expect(attempt.status).toBe("CRIADA");
    expect(attempt.professionalProfileId).toBe(f.professionalIds[0]);
    expect(attempt.actorId).toBe(f.concierge.userId);
    expect(attempt.dispatchedAt).toBeNull();
  });

  it("[NEGATIVO] não existe tentativa no modo de contato direto — só a paciente contata", async () => {
    const f = await seedIntermediado({ mode: "CONTATO_DIRETO_ACOMPANHADO" });
    const repo = new SupabaseApproachRepository(f.concierge.client);

    await expect(repo.create(f.connectionId, f.concierge.userId, now(), now())).rejects.toThrow();
  });

  it("[NEGATIVO] recusa transição inválida — CRIADA não vira RESPONDIDA direto", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());

    await expect(
      repo.respond(attempt.id, "PODE_RECEBER_CONTATO", "PROFISSIONAL", f.concierge.userId, now(), now()),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("múltiplas tentativas preservam o histórico — a nova é linha nova", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);

    const primeira = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.dispatch(primeira.id, f.concierge.userId, now(), now());
    await repo.respond(primeira.id, "INDISPONIVEL", "PROFISSIONAL", f.concierge.userId, now(), now());

    const segunda = await repo.create(f.connectionId, f.concierge.userId, now(), now());

    const todas = await repo.listAttempts(f.connectionId);
    expect(todas).toHaveLength(2);
    expect(todas[0].id).toBe(primeira.id);
    expect(todas[0].status).toBe("RESPONDIDA");
    expect(todas[0].responseKind).toBe("INDISPONIVEL");
    expect(segunda.status).toBe("CRIADA");
  });

  it("[NEGATIVO] não permite duas tentativas abertas ao mesmo tempo", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    await repo.create(f.connectionId, f.concierge.userId, now(), now());

    await expect(
      repo.create(f.connectionId, f.concierge.userId, now(), now()),
    ).rejects.toMatchObject({ code: "CONCURRENT_CONFLICT" });
  });

  it("[NEGATIVO] outro Concierge não lê a tentativa", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    await repo.create(f.connectionId, f.concierge.userId, now(), now());

    const outro = await createSecondConcierge();
    const { data } = await outro.client
      .from("approach_attempts")
      .select("id")
      .eq("connection_id", f.connectionId);

    expect(data).toHaveLength(0);
  });

  it("[NEGATIVO] outro Concierge não escreve tentativa", async () => {
    const f = await seedIntermediado();
    const outro = await createSecondConcierge();
    const repo = new SupabaseApproachRepository(outro.client);

    await expect(repo.create(f.connectionId, outro.userId, now(), now())).rejects.toThrow();
  });

  it("[NEGATIVO] a paciente não cria tentativa intermediada", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.patientClient);

    await expect(repo.create(f.connectionId, f.patientId, now(), now())).rejects.toThrow();
  });

  it("indisponibilidade NÃO troca o profissional escolhido", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.dispatch(attempt.id, f.concierge.userId, now(), now());
    await repo.respond(attempt.id, "INDISPONIVEL", "PROFISSIONAL", f.concierge.userId, now(), now());

    const { data } = await f.admin
      .from("connection_records")
      .select("professional_profile_id, status")
      .eq("id", f.connectionId)
      .single();

    expect(data!.professional_profile_id).toBe(f.professionalIds[0]);
    expect(data!.status).toBe("DECISAO_REGISTRADA");
  });

  it("cancelar a tentativa NÃO encerra a Connection", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.cancel(attempt.id, f.concierge.userId, now(), now());

    const { data } = await f.admin
      .from("connection_records")
      .select("status")
      .eq("id", f.connectionId)
      .single();
    expect(data!.status).toBe("DECISAO_REGISTRADA");
  });

  it("a tentativa não inicia Relationship", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.dispatch(attempt.id, f.concierge.userId, now(), now());
    await repo.respond(
      attempt.id,
      "PODE_RECEBER_CONTATO",
      "PROFISSIONAL",
      f.concierge.userId,
      now(),
      now(),
    );

    const { data } = await f.admin
      .from("relationship_records")
      .select("id")
      .eq("connection_id", f.connectionId);
    expect(data).toHaveLength(0);
  });

  it("o ator da tentativa não vira responsável pelo Case", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    await repo.create(f.connectionId, f.concierge.userId, now(), now());

    const { data } = await f.admin
      .from("cases")
      .select("responsible_id, responsible_role")
      .eq("id", f.caseId)
      .single();
    expect(data!.responsible_id).toBe(f.concierge.userId);
    expect(data!.responsible_role).toBe("concierge");
  });

  it("é idempotente: despachar duas vezes não duplica evento", async () => {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.dispatch(attempt.id, f.concierge.userId, now(), now());
    await repo.dispatch(attempt.id, f.concierge.userId, now(), now());

    const { data } = await f.admin
      .from("connection_events")
      .select("id")
      .eq("connection_id", f.connectionId)
      .eq("event_type", "TENTATIVA_DESPACHADA");
    expect(data).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // team_notifications
  // -------------------------------------------------------------------------

  async function comNotificacao() {
    const f = await seedIntermediado();
    const repo = new SupabaseApproachRepository(f.concierge.client);
    const attempt = await repo.create(f.connectionId, f.concierge.userId, now(), now());
    await repo.dispatch(attempt.id, f.concierge.userId, now(), now());
    return { ...f, repo, attempt };
  }

  it("a notificação nasce do fato, vinculada ao Case", async () => {
    const f = await comNotificacao();
    const notificacoes = await f.repo.listNotifications(f.caseId);

    expect(notificacoes).toHaveLength(1);
    expect(notificacoes[0].kind).toBe("TENTATIVA_DESPACHADA");
    expect(notificacoes[0].caseId).toBe(f.caseId);
    expect(notificacoes[0].approachAttemptId).toBe(f.attempt.id);
    expect(notificacoes[0].readAt).toBeNull();
  });

  it("deduplicação funciona: o mesmo fato não gera duas notificações", async () => {
    const f = await comNotificacao();
    await f.repo.dispatch(f.attempt.id, f.concierge.userId, now(), now());

    const notificacoes = await f.repo.listNotifications(f.caseId);
    expect(notificacoes.filter((n) => n.kind === "TENTATIVA_DESPACHADA")).toHaveLength(1);
  });

  it("[NEGATIVO] outro Concierge não lê a notificação", async () => {
    const f = await comNotificacao();
    const outro = await createSecondConcierge();

    const { data } = await outro.client
      .from("team_notifications")
      .select("id")
      .eq("case_id", f.caseId);
    expect(data).toHaveLength(0);
  });

  it("[NEGATIVO] a paciente não lê notificação interna", async () => {
    const f = await comNotificacao();

    const { data } = await f.patientClient
      .from("team_notifications")
      .select("id")
      .eq("case_id", f.caseId);
    expect(data).toHaveLength(0);
  });

  it("[NEGATIVO] recipient_user_id divergente NÃO amplia acesso — o teste que protege a decisão P6", async () => {
    const f = await comNotificacao();
    const outro = await createSecondConcierge();

    // A notificação passa a apontar explicitamente para o segundo Concierge.
    // Ele continua sem vínculo com o Case — e continua sem ler.
    await f.admin
      .from("team_notifications")
      .update({ recipient_user_id: outro.userId })
      .eq("case_id", f.caseId);

    const { data } = await outro.client
      .from("team_notifications")
      .select("id")
      .eq("case_id", f.caseId);
    expect(data).toHaveLength(0);
  });

  it("ler não altera responsabilidade", async () => {
    const f = await comNotificacao();
    const [notificacao] = await f.repo.listNotifications(f.caseId);
    await f.repo.markRead(notificacao.id, f.concierge.userId, now());

    const { data } = await f.admin
      .from("cases")
      .select("responsible_id")
      .eq("id", f.caseId)
      .single();
    expect(data!.responsible_id).toBe(f.concierge.userId);
  });

  it("arquivar NÃO encerra o trabalho — a tentativa continua aberta", async () => {
    const f = await comNotificacao();
    const [notificacao] = await f.repo.listNotifications(f.caseId);
    await f.repo.archive(notificacao.id, f.concierge.userId, now());

    const tentativas = await f.repo.listAttempts(f.connectionId);
    expect(tentativas[0].status).toBe("DESPACHADA");
    expect(tentativas[0].respondedAt).toBeNull();
  });

  it("o fato de origem permanece íntegro depois da leitura", async () => {
    const f = await comNotificacao();
    const [notificacao] = await f.repo.listNotifications(f.caseId);
    await f.repo.markRead(notificacao.id, f.concierge.userId, now());

    const { data } = await f.admin
      .from("connection_events")
      .select("id")
      .eq("connection_id", f.connectionId)
      .eq("event_type", "TENTATIVA_DESPACHADA");
    expect(data).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // A propriedade central: reatribuição
  // -------------------------------------------------------------------------

  it("[NEGATIVO] o ex-responsável perde acesso a tentativas e notificações", async () => {
    const f = await comNotificacao();

    const antesA = await f.concierge.client
      .from("approach_attempts")
      .select("id")
      .eq("connection_id", f.connectionId);
    expect(antesA.data).toHaveLength(1);

    const segundo = await createSecondConcierge();
    // Concierge para Concierge nao e transicao normal da jornada: e
    // excepcional, e a funcao so a aceita de um administrador autenticado.
    // A fixture usa o caminho real em vez de contornar a regra.
    const adminSession = await loginAs("administrador");
    const { error } = await adminSession.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: f.caseId,
      _new_responsible_id: segundo.userId,
      _new_role: "concierge",
      _reason: "Reatribuicao operacional.",
    });
    // O administrador pode transferir; se a via de serviço não puder, o teste
    // precisa saber disso explicitamente.
    if (error) throw new Error(`transferência recusada — ${error.message}`);

    const depoisA = await f.concierge.client
      .from("approach_attempts")
      .select("id")
      .eq("connection_id", f.connectionId);
    const depoisN = await f.concierge.client
      .from("team_notifications")
      .select("id")
      .eq("case_id", f.caseId);

    expect(depoisA.data).toHaveLength(0);
    expect(depoisN.data).toHaveLength(0);
  });

  it("a reatribuição NÃO reescreve a história — nenhum update, nenhuma duplicata", async () => {
    const f = await comNotificacao();
    const antes = await f.repo.listNotifications(f.caseId);
    const antesIds = antes.map((n) => n.id).sort();
    const antesRecipient = antes[0].recipientUserId;

    const segundo = await createSecondConcierge();
    // Concierge para Concierge nao e transicao normal da jornada: e
    // excepcional, e a funcao so a aceita de um administrador autenticado.
    // A fixture usa o caminho real em vez de contornar a regra.
    const adminSession = await loginAs("administrador");
    const { error } = await adminSession.client.schema("curadoria").rpc("transfer_case_responsibility", {
      _case_id: f.caseId,
      _new_responsible_id: segundo.userId,
      _new_role: "concierge",
      _reason: "Reatribuicao operacional.",
    });
    if (error) throw new Error(`transferência recusada — ${error.message}`);

    // O novo responsável ganha acesso sem que nada tenha sido escrito.
    const { data: depois } = await segundo.client
      .from("team_notifications")
      .select("id, recipient_user_id, created_at")
      .eq("case_id", f.caseId);

    expect(depois!.map((n) => n.id as string).sort()).toEqual(antesIds);
    expect(depois![0].recipient_user_id).toBe(antesRecipient);

    const { data: tentativas } = await segundo.client
      .from("approach_attempts")
      .select("id")
      .eq("connection_id", f.connectionId);
    expect(tentativas).toHaveLength(1);
  });
});
