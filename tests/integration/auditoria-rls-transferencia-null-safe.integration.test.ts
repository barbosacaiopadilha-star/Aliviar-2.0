import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * AUDITORIA ADVERSARIAL DE ACESSO (03/09) — a guarda dos três consertos.
 *
 * O achado que deu origem a esta suíte: `transfer_case_responsibility` tinha
 * um predicado de autoridade com lógica de três valores. Quando o Case não
 * tinha responsável (`responsible_id` nulo — o formato anterior à Correção de
 * Domínio), `responsible_id = actor` era NULO, `not (… or null …)` era NULO, e
 * o `if` **não disparava o RAISE**. Uma paciente, sem Case nenhum, redirecionou
 * o Case de outra paciente para um terceiro curador — e o banco gravou.
 *
 * Cada teste aqui entra com o token do papel e a chave pública, como um
 * cliente real. A service role só monta o cenário e limpa.
 *
 * Os Cases nascem no formato LEGADO de propósito: `responsible_id` nulo e
 * `assigned_curator_id` de outra pessoa. É o único formato que exercita o
 * ramo nulo do predicado — um Case "moderno", com responsável, já era
 * protegido antes do conserto.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users` antes.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

async function entrar(conta: TestAccount) {
  const client = createCuradoriaClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email: conta.email, password: conta.password });
  if (error) throw error;
  return { client, uid: data.user!.id };
}

describe("transfer_case_responsibility — o portão fecha também quando o Case não tem responsável", () => {
  const admin = createAdminSupabaseClient();
  let contas: TestAccount[];
  let paciente: Awaited<ReturnType<typeof entrar>>;
  let curador: Awaited<ReturnType<typeof entrar>>;
  let atendente: Awaited<ReturnType<typeof entrar>>;
  let profissional: Awaited<ReturnType<typeof entrar>>;
  // Um curador que NÃO é o que está logado: o "dono designado" do Case legado.
  let outroCuradorId: string;
  const historias: string[] = [];

  beforeAll(async () => {
    contas = loadTestAccounts();
    const por = (r: string) => contas.find((c) => c.role === r)!;
    paciente = await entrar(por("paciente"));
    curador = await entrar(por("curador_medico"));
    atendente = await entrar(por("atendente"));
    profissional = await entrar(por("profissional"));
    // O administrador serve de "outro curador designado": precisa só de um
    // uuid de perfil diferente do curador logado — o predicado compara ids.
    const adm = await entrar(por("administrador"));
    outroCuradorId = adm.uid;
  });

  /** Um Case legado sobre a própria paciente de teste, com história nova. */
  async function caseLegado(atribuidoA: string | null) {
    const { data: hist, error: eh } = await admin
      .from("patient_stories")
      .insert({ profile_id: paciente.uid, status: "enviada", current_step: "motivo", data: { teste: "rls-null-safe" }, created_by: paciente.uid })
      .select("id")
      .single();
    if (eh) throw eh;
    historias.push(hist.id);
    const { data, error } = await admin
      .from("cases")
      .insert({ patient_profile_id: paciente.uid, source_story_id: hist.id, status: "READY_FOR_CURATION", created_by: outroCuradorId, assigned_curator_id: atribuidoA, responsible_id: null, responsible_role: null })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async function estado(caseId: string) {
    const { data } = await admin.from("cases").select("responsible_id, responsible_role").eq("id", caseId).single();
    return data!;
  }

  const transferir = (c: ReturnType<typeof createCuradoriaClient>, caseId: string, para: string, papel: string) =>
    c.rpc("transfer_case_responsibility", { _case_id: caseId, _new_responsible_id: para, _new_role: papel, _reason: "teste rls" });

  it("uma paciente sem Case NÃO redireciona o Case de ninguém — nem um sem responsável", async () => {
    const caseId = await caseLegado(outroCuradorId);
    const { error } = await transferir(paciente.client, caseId, curador.uid, "curador_medico");
    expect(error, "o portão tem de fechar com 42501, não executar em silêncio").not.toBeNull();
    expect(error!.code).toBe("42501");
    expect((await estado(caseId)).responsible_id).toBeNull();
  });

  it("um profissional da Rede NÃO redireciona Case", async () => {
    const caseId = await caseLegado(outroCuradorId);
    const { error } = await transferir(profissional.client, caseId, curador.uid, "curador_medico");
    expect(error?.code).toBe("42501");
    expect((await estado(caseId)).responsible_id).toBeNull();
  });

  it("um atendente NÃO toma para si um Case designado a um curador, mesmo sem responsável", async () => {
    const caseId = await caseLegado(outroCuradorId);
    const { error } = await transferir(atendente.client, caseId, atendente.uid, "atendente");
    expect(error?.code).toBe("42501");
    expect((await estado(caseId)).responsible_id).toBeNull();
  });

  it("um curador NÃO toma para si um Case designado a OUTRO curador", async () => {
    const caseId = await caseLegado(outroCuradorId);
    const { error } = await transferir(curador.client, caseId, curador.uid, "curador_medico");
    expect(error?.code).toBe("42501");
    expect((await estado(caseId)).responsible_id).toBeNull();
  });

  it("controle do desenho: o Curador DESIGNADO de um Case sem responsável assume-o", async () => {
    const caseId = await caseLegado(curador.uid);
    const { error } = await transferir(curador.client, caseId, curador.uid, "curador_medico");
    expect(error).toBeNull();
    expect((await estado(caseId)).responsible_id).toBe(curador.uid);
  });

  it("controle do desenho: um Curador assume um Case realmente LIVRE", async () => {
    const caseId = await caseLegado(null);
    const { error } = await transferir(curador.client, caseId, curador.uid, "curador_medico");
    expect(error).toBeNull();
    expect((await estado(caseId)).responsible_role).toBe("curador_medico");
  });

  afterAll(async () => {
    // O histórico de responsabilidade é append-only: DELETE direto no Case
    // cascatearia para o log e o trigger recusaria. O caminho da casa é o
    // descarte auditado — o mesmo que as outras suítes usam no teardown.
    for (const h of historias) {
      const { data: cs } = await admin.from("cases").select("id").eq("source_story_id", h);
      for (const c of cs ?? []) {
        const { error } = await admin.rpc("discard_case_admin", {
          _case_id: c.id,
          _reason: "Teardown da suíte de auditoria de acesso (03/09).",
          _executed_by: outroCuradorId,
        });
        if (error) throw new Error(`teardown: Case ${c.id} não descartado — ${error.message}`);
      }
    }
  });
});

describe("os outros dois consertos da auditoria de 03/09", () => {
  it("relational_needs_pending NÃO é executável sem sessão", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.rpc("relational_needs_pending", { _case_id: "00000000-0000-0000-0000-00000000dead" });
    expect(error, "o anônimo tem de ser recusado no privilégio").not.toBeNull();
    expect(error!.code).toBe("42501");
  });

  it("a própria pessoa NÃO reescreve created_at nem deleted_at do seu perfil", async () => {
    const contas = loadTestAccounts();
    const pac = await entrar(contas.find((c) => c.role === "paciente")!);
    for (const patch of [{ deleted_at: new Date().toISOString() }, { created_at: "2000-01-01T00:00:00Z" }]) {
      const { error } = await pac.client.from("profiles").update(patch).eq("id", pac.uid).select("id");
      expect(error, `${Object.keys(patch)[0]} tem de ser barrado`).not.toBeNull();
      expect(error!.code).toBe("42501");
    }
  });

  it("controle: a própria pessoa continua editando o display_name", async () => {
    const contas = loadTestAccounts();
    const pac = await entrar(contas.find((c) => c.role === "paciente")!);
    const { data: antes } = await pac.client.from("profiles").select("display_name").eq("id", pac.uid).single();
    const { error } = await pac.client.from("profiles").update({ display_name: antes!.display_name }).eq("id", pac.uid);
    expect(error).toBeNull();
  });
});
