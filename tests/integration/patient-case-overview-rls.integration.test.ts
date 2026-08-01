import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * RC1 / R1 — `curadoria.patient_case_overview` não vaza Case entre pacientes.
 *
 * Esta suíte existe por causa de uma lição, não de um bug: a view protegia os
 * dados por uma única cláusula `where ... = auth.uid()`, com a RLS desligada
 * atrás dela. Não havia vazamento — havia uma proteção sem segunda camada.
 *
 * O teste é permanente porque é a segunda camada em forma de código: se
 * alguém remover `security_invoker`, afrouxar o filtro da view, ou apagar a
 * policy da paciente, um destes casos quebra.
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

describe("patient_case_overview — isolamento entre pacientes", () => {
  let accounts: TestAccount[];
  let curadorId: string;

  beforeAll(async () => {
    accounts = loadTestAccounts();
    const curador = accounts.find((a) => a.role === "curador_medico")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: curador.email,
      password: curador.password,
    });
    const { data } = await client.auth.getUser();
    curadorId = data.user!.id;
  });

  let createdProfileIds: string[] = [];
  let createdCaseIds: string[] = [];

  afterEach(async () => {
    const admin = createAdminSupabaseClient();
    if (createdCaseIds.length > 0) {
      await admin.from("cases").delete().in("id", createdCaseIds);
      createdCaseIds = [];
    }
    if (createdProfileIds.length > 0) {
      await admin.from("patient_stories").delete().in("profile_id", createdProfileIds);
      await admin.from("patient_profiles").delete().in("profile_id", createdProfileIds);
      await admin.from("user_roles").delete().in("profile_id", createdProfileIds);
      for (const id of createdProfileIds) await admin.auth.admin.deleteUser(id);
      createdProfileIds = [];
    }
  });

  /** Uma paciente com um Case seu. Fixture mínima: a view só lê `cases`. */
  async function seedPaciente(rotulo: string) {
    const admin = createAdminSupabaseClient();
    const suffix = unique(rotulo);
    const email = `${suffix}@aliviar-conexao.local`;
    const password = `Senha-${suffix}!`;

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `Paciente ${rotulo}` },
    });
    if (error || !created?.user) throw new Error(`fixture: paciente — ${error?.message}`);
    const profileId = created.user.id;
    createdProfileIds.push(profileId);

    const { data: role } = await admin.from("roles").select("id").eq("slug", "paciente").single();
    await admin.from("user_roles").insert({ profile_id: profileId, role_id: role!.id });

    const { data: story, error: storyError } = await admin
      .from("patient_stories")
      .insert({
        profile_id: profileId,
        status: "enviada",
        current_step: "revisao",
        data: { motivo: "Fixture de isolamento." },
        created_by: profileId,
      })
      .select("id")
      .single();
    if (storyError) throw new Error(`fixture: história — ${storyError.message}`);

    const { data: caseRow, error: caseError } = await admin
      .from("cases")
      .insert({
        patient_profile_id: profileId,
        source_story_id: story!.id,
        created_by: curadorId,
        assigned_curator_id: curadorId,
        responsible_id: curadorId,
        responsible_role: "curador_medico",
      })
      .select("id")
      .single();
    if (caseError) throw new Error(`fixture: Case — ${caseError.message}`);
    createdCaseIds.push(caseRow!.id as string);

    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email, password });

    return { client, profileId, caseId: caseRow!.id as string };
  }

  it("a paciente vê o próprio Case pela view", async () => {
    const a = await seedPaciente("a");

    const { data, error } = await a.client
      .from("patient_case_overview")
      .select("case_id, patient_profile_id, status_label")
      .eq("case_id", a.caseId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].patient_profile_id).toBe(a.profileId);
    // O rótulo continua sendo o texto em linguagem dela — comportamento
    // preservado, não só acesso.
    expect(data![0].status_label).toBe("Recebemos sua história.");
  });

  it("[NEGATIVO] a paciente A NÃO lê o Case da paciente B pela view", async () => {
    const a = await seedPaciente("a");
    const b = await seedPaciente("b");

    // Consulta dirigida ao Case da outra, com o id em mãos: o pior cenário.
    const { data, error } = await a.client
      .from("patient_case_overview")
      .select("case_id, patient_profile_id")
      .eq("case_id", b.caseId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("[NEGATIVO] a paciente A não alcança o Case da B nem varrendo a view inteira", async () => {
    const a = await seedPaciente("a");
    const b = await seedPaciente("b");

    const { data } = await a.client.from("patient_case_overview").select("case_id");

    const ids = (data ?? []).map((r) => r.case_id as string);
    expect(ids).toContain(a.caseId);
    expect(ids).not.toContain(b.caseId);
  });

  it("[NEGATIVO] anônimo não lê nada pela view", async () => {
    const a = await seedPaciente("a");
    const anonimo = createCuradoriaClient(url, anonKey);

    const { data } = await anonimo.from("patient_case_overview").select("case_id");
    expect((data ?? []).map((r) => r.case_id as string)).not.toContain(a.caseId);
  });

  it("a paciente lê a view sem depender de acesso direto a outras tabelas", async () => {
    const a = await seedPaciente("a");

    // Com security_invoker, a leitura passa pela policy `cases_select_paciente`.
    // Este teste fixa que a paciente continua alcançando o próprio panorama
    // por esse caminho — é o que provaria a quebra se a policy sumisse.
    const viaView = await a.client
      .from("patient_case_overview")
      .select("case_id")
      .eq("case_id", a.caseId);
    const viaTabela = await a.client.from("cases").select("id").eq("id", a.caseId);

    expect(viaView.data).toHaveLength(1);
    expect(viaTabela.data).toHaveLength(1);
  });
});
