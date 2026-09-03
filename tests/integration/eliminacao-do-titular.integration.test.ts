import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * ELIMINAÇÃO DO TITULAR (03/09) — a guarda do SIM-99.
 *
 * A auditoria 2 provou que uma assistida completa não podia ser apagada:
 * `deleteUser` falhava com erro vazio por três bloqueios estruturais, e o
 * storage não era alcançado por nada. A migration 20260903040000 destrava os
 * três e abre uma porta única, `eliminar_titular`.
 *
 * Esta suíte faz o que a auditoria fez — monta a pessoa INTEIRA — e então
 * varre TUDO depois: cada tabela do schema, o storage e o `auth.users`,
 * procurando o uuid, o e-mail, o nome e o telefone dela. O único rastro que
 * pode sobrar é a auditoria, e nela o id da pessoa mora no `metadata`.
 *
 * O storage é removido por quem chama, pela API — é o contrato da função. O
 * teste cumpre o contrato e confere que a pasta ficou vazia.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users`.");
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/** As tabelas em que uma assistida deixa rastro — e as colunas em que ele aparece. */
const ONDE_A_PESSOA_APARECE: ReadonlyArray<readonly [string, string[]]> = [
  ["profiles", ["id", "display_name"]],
  ["patient_profiles", ["profile_id", "phone"]],
  ["user_roles", ["profile_id"]],
  ["user_settings", ["profile_id"]],
  ["patient_stories", ["profile_id", "created_by"]],
  ["patient_story_versions", ["created_by"]],
  ["patient_documents", ["profile_id", "uploaded_by"]],
  ["patient_notifications", ["profile_id"]],
  ["cases", ["patient_profile_id"]],
  ["case_notes", ["body"]],
  ["case_events", ["reason"]],
  ["crm_contacts", ["patient_profile_id", "email", "full_name", "phone"]],
  ["data_subject_requests", ["profile_id"]],
  ["legal_acceptances", ["profile_id"]],
];

describe("eliminar_titular — a pessoa inteira some, e só a auditoria fica", () => {
  const admin = createAdminSupabaseClient();
  let contas: TestAccount[];
  let adminId: string;
  let curadorId: string;
  let atendenteId: string;

  // A pessoa desta suíte.
  const marca = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const NOME = `Titular Eliminada ${marca}`;
  const EMAIL = `eliminada-${marca}@teste-lgpd.local`;
  const FONE = `+5527${marca.replace(/\D/g, "").padEnd(9, "3").slice(0, 9)}`;
  let UID = "";
  let CAMINHO = "";

  const uidDe = async (conta: TestAccount) => {
    const c = createCuradoriaClient(url, anonKey);
    const { data, error } = await c.auth.signInWithPassword({ email: conta.email, password: conta.password });
    if (error) throw error;
    return data.user!.id;
  };

  beforeAll(async () => {
    contas = loadTestAccounts();
    const por = (r: string) => contas.find((c) => c.role === r)!;
    adminId = await uidDe(por("administrador"));
    curadorId = await uidDe(por("curador_medico"));
    atendenteId = await uidDe(por("atendente"));

    // ── a pessoa, completa ────────────────────────────────────────────────
    const { data: criada, error: eU } = await admin.auth.admin.createUser({
      email: EMAIL, password: `senha-${marca}`, email_confirm: true, user_metadata: { display_name: NOME },
    });
    if (eU) throw eU;
    UID = criada.user.id;
    const { data: papel } = await admin.from("roles").select("id").eq("slug", "paciente").single();
    await admin.from("user_roles").upsert({ profile_id: UID, role_id: papel!.id });
    await admin.from("patient_profiles").upsert({ profile_id: UID, phone: FONE, city: "Vitória", state: "ES", status: "ativo" });

    const agora = new Date().toISOString();
    const { error: eL } = await admin.from("crm_contacts").insert({
      full_name: NOME, email: EMAIL, phone: FONE, source: "porta_publica",
      source_detail: "pedido pelo site · consentimento privacidade-2026-08",
      consent_status: "concedido", consent_recorded_at: agora,
      patient_profile_id: UID, converted_at: agora, converted_by: atendenteId,
    });
    if (eL) throw eL;

    const { data: hist, error: eH } = await admin.from("patient_stories")
      .insert({ profile_id: UID, status: "rascunho", current_step: "motivo", data: { motivo: `Dor crônica. ${NOME}. ${FONE}.` }, created_by: UID })
      .select("id").single();
    if (eH) throw eH;
    await admin.from("patient_stories").update({ data: { motivo: `Dor crônica (v2). ${NOME}. ${EMAIL}` } }).eq("id", hist.id);
    await admin.from("patient_stories").update({ status: "enviada", submitted_at: agora }).eq("id", hist.id);

    const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
    CAMINHO = `${UID}/laudo-${marca}.pdf`;
    const up = await admin.storage.from("patient-documents").upload(CAMINHO, PDF, { contentType: "application/pdf" });
    if (up.error) throw up.error;
    const { data: doc, error: eD } = await admin.from("patient_documents")
      .insert({ profile_id: UID, file_path: CAMINHO, file_name: `laudo-${marca}.pdf`, content_type: "application/pdf", file_size: PDF.length, uploaded_by: UID })
      .select("id").single();
    if (eD) throw eD;
    await admin.from("patient_story_attachments").insert({ story_id: hist.id, document_id: doc.id });
    // Um órfão na pasta dela, sem linha — o caso dos "20 sem dono" de julho.
    const orfao = await admin.storage.from("patient-documents").upload(`${UID}/orfao-${marca}.pdf`, PDF, { contentType: "application/pdf" });
    if (orfao.error) throw orfao.error;

    const { data: caso, error: eC } = await admin.from("cases")
      .insert({ patient_profile_id: UID, source_story_id: hist.id, status: "NEW", created_by: atendenteId, responsible_id: atendenteId, responsible_role: "atendente" })
      .select("id").single();
    if (eC) throw eC;
    // Transferência real → histórico append-only, o que travava a cascata.
    const ate = createCuradoriaClient(url, anonKey);
    await ate.auth.signInWithPassword({ email: por("atendente").email, password: por("atendente").password });
    const t = await ate.rpc("transfer_case_responsibility", { _case_id: caso.id, _new_responsible_id: curadorId, _new_role: "curador_medico", _reason: "teste de eliminação" });
    if (t.error) throw t.error;
    await admin.from("case_notes").insert({ case_id: caso.id, author_id: curadorId, body: `Nota sobre ${NOME}.` });
    await admin.from("patient_notifications").insert({ profile_id: UID, title: `Bem-vinda, ${NOME}`, body: "Sua área está pronta." });
    await admin.from("data_subject_requests").insert({ profile_id: UID, tipo: "exclusao" });
  });

  /** Conta em quantas tabelas/colunas a pessoa ainda aparece. */
  async function rastro(): Promise<string[]> {
    const achados: string[] = [];
    for (const [tabela, colunas] of ONDE_A_PESSOA_APARECE) {
      for (const col of colunas) {
        const valores = col === "id" || /_id$|_by$/.test(col) ? [UID] : [NOME, EMAIL, FONE, UID];
        for (const v of valores) {
          const q = col === "id" || /_id$|_by$/.test(col)
            ? admin.from(tabela).select(col, { count: "exact", head: true }).eq(col, v)
            : admin.from(tabela).select(col, { count: "exact", head: true }).ilike(col, `%${v}%`);
          const { count, error } = await q;
          if (!error && count) achados.push(`${tabela}.${col}`);
        }
      }
    }
    const { data: u } = await admin.auth.admin.getUserById(UID);
    if (u?.user) achados.push("auth.users");
    const { data: objs } = await admin.storage.from("patient-documents").list(UID);
    if (objs && objs.length) achados.push(`storage(${objs.length})`);
    return [...new Set(achados)];
  }

  it("antes: a pessoa está em toda parte — inclusive num arquivo órfão do storage", async () => {
    const onde = await rastro();
    expect(onde).toContain("profiles.id");
    expect(onde).toContain("patient_story_versions.created_by");
    expect(onde).toContain("crm_contacts.email");
    expect(onde).toContain("cases.patient_profile_id");
    expect(onde).toContain("auth.users");
    expect(onde).toContain("storage(2)");
  });

  it("anon e assistida NÃO chamam eliminar_titular — só o serviço, com administrador", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const r1 = await anon.rpc("eliminar_titular", { _profile_id: UID, _reason: "x", _executed_by: null });
    expect(r1.error?.code, "anon tem de ser recusado no privilégio").toBe("42501");
    const pac = createCuradoriaClient(url, anonKey);
    const paciente = contas.find((c) => c.role === "paciente")!;
    await pac.auth.signInWithPassword({ email: paciente.email, password: paciente.password });
    const r2 = await pac.rpc("eliminar_titular", { _profile_id: UID, _reason: "x", _executed_by: null });
    expect(r2.error?.code).toBe("42501");
    // Com service role mas sem executor administrador: recusa no corpo.
    const r3 = await admin.rpc("eliminar_titular", { _profile_id: UID, _reason: "x", _executed_by: curadorId });
    expect(r3.error?.message).toMatch(/administrador/);
  });

  it("elimina: auditoria primeiro, depois nada — e devolve o que o chamador remove do storage", async () => {
    const { data, error } = await admin.rpc("eliminar_titular", { _profile_id: UID, _reason: "pedido da titular (teste)", _executed_by: adminId });
    expect(error, error?.message).toBeNull();
    expect(data.cases_discarded).toBe(1);
    expect(data.contacts_removed).toBe(1);
    expect(data.stories_removed).toBe(1);
    expect(data.documents_removed).toBe(1);
    // O contrato: os caminhos vêm de volta, inclusive o órfão sem linha.
    expect(data.storage_paths).toHaveLength(2);
    expect(data.storage_paths).toContain(CAMINHO);

    // O chamador cumpre a parte dele.
    const rm = await admin.storage.from("patient-documents").remove(data.storage_paths);
    expect(rm.error).toBeNull();

    const onde = await rastro();
    expect(onde, `a pessoa ainda aparece em: ${onde.join(", ")}`).toEqual([]);
  });

  it("o rastro que fica é a auditoria — com o id no metadata e o alvo nulo", async () => {
    const { data: fecho } = await admin.from("audit_logs").select("target_profile_id, metadata")
      .eq("action", "data_subject_request_closed").contains("metadata", { profile_id: UID });
    expect(fecho).toHaveLength(1);
    expect(fecho![0].target_profile_id, "a coluna com FK vira nulo com a pessoa").toBeNull();
    expect(fecho![0].metadata.cases_discarded).toBe(1);

    const { data: papel } = await admin.from("audit_logs").select("target_profile_id, metadata")
      .eq("action", "role_revoked").contains("metadata", { profile_id: UID });
    expect(papel!.length, "a revogação do papel durante a cascata foi registrada, sem abortar").toBeGreaterThanOrEqual(1);
    expect(papel![0].target_profile_id).toBeNull();

    const { data: descarte } = await admin.from("audit_logs").select("metadata")
      .eq("action", "case_discarded").ilike("metadata->>reason", "eliminação do titular%");
    expect(descarte!.length).toBeGreaterThanOrEqual(1);
  });

  it.todo("recusa quando um Case da pessoa tem julgamento do Curador — a cerca do CONTRATO_2_4 (exige fixture de julgamento; SIM-99, decisão de domínio pendente)");

  afterAll(async () => {
    // Se algum teste falhou no meio, a pessoa pode ter sobrado. Tenta a porta;
    // se ela também falhar, o resíduo fica visível na próxima execução — que é
    // preferível a esconder.
    const { data: u } = await admin.auth.admin.getUserById(UID);
    if (u?.user) {
      const r = await admin.rpc("eliminar_titular", { _profile_id: UID, _reason: "teardown", _executed_by: adminId });
      if (!r.error && r.data?.storage_paths?.length) await admin.storage.from("patient-documents").remove(r.data.storage_paths);
    }
  });
});
