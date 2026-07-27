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

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const admin = createAdminSupabaseClient();

let criados: string[] = [];

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

  it("perfil de demonstração não pode ser publicado", async () => {
    const id = await criarProfissional({ is_demo: true });

    const { error } = await admin
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", id);

    expect(error).not.toBeNull();
    expect(error!.message.toLowerCase()).toContain("professional_demo_never_published");
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

  it("profissional real pode ser publicado", async () => {
    const id = await criarProfissional({ is_demo: false });

    const { error } = await admin
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", id);

    expect(error).toBeNull();
  });

  it("perfil de demonstração não entra numa seleção", async () => {
    const demo = await criarProfissional({ is_demo: true });

    // Buscar o Perfil primeiro e o Case a partir dele — o contrário desiste
    // sempre que o Case sorteado não tiver Consulta Inicial, e um teste que
    // desiste em silêncio passa sem provar nada.
    const { data: perfil } = await admin
      .from("priority_profiles")
      .select("id, case_id")
      .limit(1)
      .maybeSingle();

    expect(perfil, "nenhum Perfil de Prioridades no banco local — o teste não pode provar o gatilho").toBeTruthy();

    const { data: selecao, error: erroSelecao } = await admin
      .from("curated_selections")
      .insert({
        case_id: perfil!.case_id,
        priority_profile_id: perfil!.id,
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

    const { data: paciente } = await admin.from("patient_profiles").select("profile_id").limit(1).maybeSingle();
    const { data: caso } = await admin.from("cases").select("id").limit(1).maybeSingle();
    expect(paciente, "nenhum paciente no banco local").toBeTruthy();
    expect(caso, "nenhum Case no banco local").toBeTruthy();

    const { error } = await admin.from("connection_records").insert({
      case_id: caso!.id,
      patient_profile_id: paciente!.profile_id,
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
