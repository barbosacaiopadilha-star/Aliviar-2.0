// PROTEÇÃO DA REDE — perfil de demonstração não alcança paciente
//
// Estes testes perguntam ao banco, não à aplicação. A distinção importa: a
// interface é um caminho entre muitos, e a garantia precisa valer para o
// console, para um script de migração e para qualquer código futuro que
// alguém escreva sem lembrar desta regra.
//
// Usam o cliente de serviço de propósito. Se a proteção dependesse de RLS,
// service_role passaria por cima dela — e passar é exatamente o que não pode
// acontecer.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "./curadoria-client";

const admin = createAdminSupabaseClient();

let criados: string[] = [];

// A cadeia própria dos testes que precisam de Case/paciente/seleção. A versão
// anterior pegava o primeiro Case do banco — o Case de OUTRA suíte — e o
// atalho só apareceu quando um reset mudou a ordem de execução: além de
// falhar, contaminava a suíte dona do Case com uma seleção órfã.
let pacienteProfileId: string | null = null;
let ownCaseId: string | null = null;
let ownPriorityProfileId: string | null = null;

async function ensureOwnChain(): Promise<{ caseId: string; priorityProfileId: string; patientProfileId: string }> {
  if (ownCaseId && ownPriorityProfileId && pacienteProfileId) {
    return { caseId: ownCaseId, priorityProfileId: ownPriorityProfileId, patientProfileId: pacienteProfileId };
  }

  const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
  const accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8")) as {
    role: string;
    email: string;
    password: string;
  }[];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  const adminAccount = accounts.find((a) => a.role === "administrador")!;
  const adminAuth = createCuradoriaClient(url, anonKey);
  await adminAuth.auth.signInWithPassword({ email: adminAccount.email, password: adminAccount.password });
  const {
    data: { user: adminUser },
  } = await adminAuth.auth.getUser();

  const email = `rede-demo-${Date.now()}@aliviar-conexao.local`;
  const paciente = await createPatientAccount(
    admin,
    adminAuth,
    { email, displayName: "Paciente Rede Demo (teste)" },
    adminUser!.id,
  );
  pacienteProfileId = paciente.profileId;

  const patientClient = createCuradoriaClient(url, anonKey);
  await patientClient.auth.signInWithPassword({ email, password: paciente.password });
  const draft = await getOrCreateActiveStory(patientClient, paciente.profileId);
  const story = await submitStory(patientClient, draft.id, draft.revision);

  const curadorAccount = accounts.find((a) => a.role === "curador_medico")!;
  const curadorAuth = createCuradoriaClient(url, anonKey);
  await curadorAuth.auth.signInWithPassword({ email: curadorAccount.email, password: curadorAccount.password });
  const {
    data: { user: curadorUser },
  } = await curadorAuth.auth.getUser();

  const kase = await createCase(adminAuth, story.id, curadorUser!.id, adminUser!.id);
  ownCaseId = kase.id;

  const { data: perfil, error } = await admin
    .from("priority_profiles")
    .insert({ case_id: kase.id, curator_id: curadorUser!.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  ownPriorityProfileId = perfil!.id as string;

  return { caseId: ownCaseId, priorityProfileId: ownPriorityProfileId, patientProfileId: pacienteProfileId };
}

async function criarProfissional(fields: Record<string, unknown>): Promise<string> {
  const { data, error } = await admin
    .from("professional_profiles")
    .insert({
      display_name: "Profissional de teste",
      professional_identifier: `TESTE-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_by: (await admin.from("profiles").select("id").limit(1).single()).data!.id,
      ...fields,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  criados.push(data!.id as string);
  return data!.id as string;
}

describe("rede de demonstração — o banco recusa, não a tela (Supabase local)", () => {
  beforeAll(() => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY ausente").toBeTruthy();
  });

  afterEach(async () => {
    if (criados.length === 0) return;
    await admin.from("professional_profiles").delete().in("id", criados);
    criados = [];
  });

  afterAll(async () => {
    if (ownCaseId) await admin.from("cases").delete().eq("id", ownCaseId);
    if (pacienteProfileId) {
      await admin.from("patient_stories").delete().eq("profile_id", pacienteProfileId);
      await admin.from("patient_profiles").delete().eq("profile_id", pacienteProfileId);
      await admin.from("user_roles").delete().eq("profile_id", pacienteProfileId);
      await admin.auth.admin.deleteUser(pacienteProfileId);
    }
  }, 60_000);

  it("perfil de demonstração não pode ser publicado", async () => {
    const id = await criarProfissional({ is_demo: true });

    const { error } = await admin
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", id);

    expect(error).not.toBeNull();
    // Duas guardas cobrem isto — o CHECK e o gatilho de requisitos de
    // publicação. Qual delas responde primeiro é detalhe de ordenação; o que
    // importa é a recusa dizer do que se trata.
    expect(error!.message.toLowerCase()).toMatch(/demonstracao|demo_never_published/);
  });

  it("perfil de demonstração não pode nascer publicado", async () => {
    const { error } = await admin.from("professional_profiles").insert({
      display_name: "Nasce publicado?",
      professional_identifier: `TESTE-DEMO-${Date.now()}`,
      created_by: (await admin.from("profiles").select("id").limit(1).single()).data!.id,
      is_demo: true,
      publication_status: "publicado",
    });

    expect(error).not.toBeNull();
  });

  it("profissional real que cumpre os requisitos pode ser publicado", async () => {
    const agora = new Date().toISOString();
    const autor = (await admin.from("profiles").select("id").limit(1).single()).data!.id;

    const id = await criarProfissional({
      is_demo: false,
      crm: "654321",
      crm_uf: "SP",
      registration_status: "regular",
      registration_source: "Consulta ao conselho (teste)",
      registration_verified_at: agora,
      registration_verified_by: autor,
    });

    await admin.from("professional_practice_areas").insert({
      professional_profile_id: id,
      raw_text: "Área declarada para exercício do fluxo de teste.",
      source: "Teste de integração",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: autor,
    });

    const { error } = await admin
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", id);

    expect(error).toBeNull();
  });

  it("profissional real sem os requisitos não é publicado — ser real não basta", async () => {
    const id = await criarProfissional({ is_demo: false });

    const { error } = await admin
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", id);

    expect(error).not.toBeNull();
  });

  it("perfil de demonstração não entra numa seleção", async () => {
    const demo = await criarProfissional({ is_demo: true });
    const { caseId, priorityProfileId } = await ensureOwnChain();

    const { data: selecao, error: erroSelecao } = await admin
      .from("curated_selections")
      .insert({
        case_id: caseId,
        priority_profile_id: priorityProfileId,
        selected_by: (await admin.from("profiles").select("id").limit(1).single()).data!.id,
        composition_rationale: "Seleção de teste do gatilho.",
      })
      .select("id")
      .single();

    expect(erroSelecao).toBeNull();

    const { error } = await admin.from("curated_selection_options").insert({
      curated_selection_id: selecao!.id,
      professional_profile_id: demo,
      position: 1,
      band: "ALTA",
      rationale: "Tentativa de incluir perfil de demonstração.",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain("demonstracao");

    await admin.from("curated_selections").delete().eq("id", selecao!.id);
  });

  it("perfil de demonstração não vira conexão", async () => {
    const demo = await criarProfissional({ is_demo: true });
    const { caseId, patientProfileId } = await ensureOwnChain();

    const { error } = await admin.from("connection_records").insert({
      case_id: caseId,
      patient_profile_id: patientProfileId,
      professional_profile_id: demo,
      status: "PENDING",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain("demonstracao");
  });

  it("a Rede operacional exclui os perfis de demonstração", async () => {
    const demo = await criarProfissional({ is_demo: true, status: "ativo" });
    const real = await criarProfissional({ is_demo: false, status: "ativo" });

    const { data } = await admin
      .from("professional_profiles")
      .select("id")
      .eq("status", "ativo")
      .eq("is_demo", false);

    const ids = (data ?? []).map((row) => row.id as string);
    expect(ids).toContain(real);
    expect(ids).not.toContain(demo);
  });

  it("ausência de verificação de registro continua distinta de irregular", async () => {
    const id = await criarProfissional({ crm: "123456", crm_uf: "SP" });

    const { data } = await admin
      .from("professional_profiles")
      .select("registration_status, registration_verified_at")
      .eq("id", id)
      .single();

    // Ninguém consultou o conselho. Isso não é "irregular" — é "não se sabe".
    expect(data!.registration_status).toBeNull();
    expect(data!.registration_verified_at).toBeNull();
  });

  it("situação de registro só aceita os três estados conhecidos", async () => {
    const id = await criarProfissional({});

    const { error } = await admin
      .from("professional_profiles")
      .update({ registration_status: "provavelmente_ok" })
      .eq("id", id);

    expect(error).not.toBeNull();
  });
});
