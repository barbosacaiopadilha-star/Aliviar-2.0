import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import {
  listCompetencyDomains,
  replaceCompetencyDomains,
  updateProfessionalProfile,
} from "@/modules/profiles/professional-repository";

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

function uniqueIdentifier(): string {
  return `TESTE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("perfil profissional — RLS e fundação administrativa (Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente — rode `npm run supabase:env`").toBeTruthy();
    expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente — rode `npm run supabase:env`").toBeTruthy();
    accounts = loadTestAccounts();
  });

  // Isolamento de dados entre testes (mesmo achado/correção já aplicado a
  // concierge/human-review/final-curadoria-delivery): professional_profiles
  // é um recurso global, nunca escopado por teste — os 3 testes abaixo que
  // efetivamente criam uma linha (administrador tem permissão; paciente e
  // profissional são bloqueados por RLS e nunca chegam a criar nada) nunca
  // a removiam. Nenhum deles cria professional_competency_areas,
  // professional_documents ou conta de autenticação própria — são registros
  // puramente administrativos (created_by aponta para o admin).
  let createdProfessionalProfileIds: string[] = [];

  afterEach(async () => {
    if (createdProfessionalProfileIds.length === 0) {
      return;
    }
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalProfileIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalProfileIds);
    createdProfessionalProfileIds = [];
  });

  it("paciente (usuário comum) não consegue criar perfil profissional", async () => {
    const paciente = accounts.find((a) => a.role === "paciente")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: paciente.email, password: paciente.password });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa de autocadastro",
      professional_identifier: uniqueIdentifier(),
      created_by: user!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("profissional (mesmo autenticado) não consegue criar o próprio perfil profissional", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa de autocadastro",
      professional_identifier: uniqueIdentifier(),
      created_by: user!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });

  it("administrador cria perfil profissional", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { data, error } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Profissional de Teste",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
      })
      .select("*")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("ativo");
    expect(data?.publication_status).toBe("nao_publicado");
    expect(data?.created_by).toBe(user!.id);
    if (data?.id) createdProfessionalProfileIds.push(data.id);

    await client.auth.signOut();
  });

  it("administrador edita perfil profissional", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    const { data: created } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Antes da edição",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
      })
      .select("id")
      .single();
    if (created?.id) createdProfessionalProfileIds.push(created.id);

    const { data: updated, error } = await client
      .from("professional_profiles")
      .update({ display_name: "Depois da edição", updated_by: user!.id })
      .eq("id", created!.id)
      .select("display_name")
      .single();

    expect(error).toBeNull();
    expect(updated?.display_name).toBe("Depois da edição");

    await client.auth.signOut();
  });

  it("administrador ativa/desativa publicação", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const {
      data: { user },
    } = await client.auth.getUser();

    // Publicar deixou de ser um botão e virou uma porta com condições
    // (política de fontes): CRM, registro consultado no conselho e área de
    // atuação verificada, cada um com fonte, autor e data. O teste percorre o
    // caminho inteiro porque é ele que a produção exige.
    const agora = new Date().toISOString();

    const { data: created } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Para Publicar",
        professional_identifier: uniqueIdentifier(),
        created_by: user!.id,
        crm: uniqueIdentifier().slice(0, 20),
        crm_uf: "SP",
        registration_status: "regular",
        registration_source: "Consulta ao conselho profissional (teste)",
        registration_verified_at: agora,
        registration_verified_by: user!.id,
      })
      .select("id")
      .single();
    if (created?.id) createdProfessionalProfileIds.push(created.id);

    await client.from("professional_practice_areas").insert({
      professional_profile_id: created!.id,
      raw_text: "Área declarada para exercício do fluxo de teste.",
      source: "Teste de integração",
      verification_status: "verificado",
      verified_at: agora,
      verified_by: user!.id,
    });

    const { data: published, error: publishError } = await client
      .from("professional_profiles")
      .update({ ciclo_de_vida: "PUBLICADO_ATIVO", ciclo_motivo: "CADASTRO_VALIDADO" })
      .eq("id", created!.id)
      .select("publication_status")
      .single();

    expect(publishError).toBeNull();
    expect(published?.publication_status).toBe("publicado");

    // C7R · o contrato mudou, e o oráculo muda com ele. `status` virou espelho
    // do ciclo: escrevê-lo direto é recusado pelo banco — este era o writer
    // paralelo que fazia selo e Mesa divergirem. Medimos a recusa E o caminho
    // certo: despublicar pela transição, que leva a PAUSADO e espelha
    // `status = 'inativo'` na mesma instrução.
    const { error: escritaDireta } = await client
      .from("professional_profiles")
      .update({ status: "inativo", updated_by: user!.id })
      .eq("id", created!.id);
    expect(escritaDireta, "o banco voltou a aceitar escrita direta em status").not.toBeNull();
    expect(escritaDireta!.message).toContain("mudanças de ciclo");

    const { data: deactivated, error: statusError } = await client
      .from("professional_profiles")
      .update({ ciclo_de_vida: "PAUSADO", ciclo_motivo: "REVISAO_CADASTRAL" })
      .eq("id", created!.id)
      .select("status, publication_status, ciclo_de_vida")
      .single();

    expect(statusError).toBeNull();
    expect(deactivated?.ciclo_de_vida).toBe("PAUSADO");
    expect(deactivated?.status, "o espelho não acompanhou a pausa").toBe("inativo");
    expect(deactivated?.publication_status).toBe("nao_publicado");

    await client.auth.signOut();
  });

  it("profissional autenticado, ainda sem vínculo, não vê nenhum registro profissional", async () => {
    const profissional = accounts.find((a) => a.role === "profissional")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: profissional.email,
      password: profissional.password,
    });

    const { data, error } = await client.from("professional_profiles").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([]);

    await client.auth.signOut();
  });

  // -------------------------------------------------------------------------
  // Bloco B/E7 (gate B15) — semântica de patch das áreas de competência:
  // campo ausente = "não alterar"; lista vazia só remove com comando
  // explícito; substituição declarada converge sem estado parcial.
  // -------------------------------------------------------------------------

  async function criarProfissionalComAreas(
    client: ReturnType<typeof createCuradoriaClient>,
    adminUserId: string,
    dominios: string[],
  ): Promise<string> {
    const { data: created, error } = await client
      .from("professional_profiles")
      .insert({
        display_name: "Profissional Competências E7",
        professional_identifier: uniqueIdentifier(),
        created_by: adminUserId,
      })
      .select("id")
      .single();
    expect(error, `fixture do profissional: ${error?.message}`).toBeNull();
    const id = created!.id as string;
    createdProfessionalProfileIds.push(id);

    if (dominios.length > 0) {
      const { error: areasError } = await client.from("professional_competency_areas").insert(
        dominios.map((domain) => ({ professional_profile_id: id, domain, focus: "avaliacao" })),
      );
      expect(areasError, `fixture das áreas: ${areasError?.message}`).toBeNull();
    }
    return id;
  }

  it("editar dados básicos preserva as áreas de competência (Bloco B/E7, gate B15)", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user },
    } = await client.auth.getUser();

    const dominios = ["saude_fisica", "saude_emocional_mental", "nao_determinado"];
    const id = await criarProfissionalComAreas(client, user!.id, dominios);

    // O caminho real da action de edição: update dos dados básicos e NENHUMA
    // substituição de coleções que o formulário não enviou (o form real não
    // tem campos de competência — parseia para []).
    await updateProfessionalProfile(client, id, {
      displayName: "Profissional Competências E7 — editado",
      professionalIdentifier: uniqueIdentifier(),
      crm: null,
      crmUf: null,
      professionalSummary: "Resumo editado sem tocar nas competências.",
      institutionName: null,
      updatedBy: user!.id,
    });

    // Defesa em profundidade: mesmo que alguém chame o replace com a lista
    // vazia do parse, ausência de declaração NÃO apaga nada.
    await replaceCompetencyDomains(client, id, []);

    const depois = await listCompetencyDomains(client, id);
    expect(depois.sort(), "editar dados básicos preserva as competências").toEqual(
      [...dominios].sort(),
    );

    await client.auth.signOut();
  });

  it("substituição declarada converge (retry idempotente) e esvaziar exige comando explícito", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user },
    } = await client.auth.getUser();

    const id = await criarProfissionalComAreas(client, user!.id, [
      "saude_fisica",
      "saude_emocional_mental",
      "nao_determinado",
    ]);

    // Substituição declarada: o conjunto final é exatamente o declarado.
    await replaceCompetencyDomains(client, id, ["saude_fisica"]);
    expect(await listCompetencyDomains(client, id)).toEqual(["saude_fisica"]);

    // Retry da MESMA substituição: mesmo resultado, sem duplicar, sem apagar.
    await replaceCompetencyDomains(client, id, ["saude_fisica"]);
    const { count } = await createAdminSupabaseClient()
      .from("professional_competency_areas")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", id);
    expect(count, "retry não duplica nem apaga").toBe(1);

    // Esvaziar SÓ com o comando explícito — nunca por lista vazia implícita.
    // Bloco C (Etapa 8): o comando agora carrega motivo e vira ato auditado
    // (RPC remove_professional_competencies) — ampliação do contrato, não
    // afrouxamento: o cenário continua provando que só o explícito esvazia.
    await replaceCompetencyDomains(client, id, [], {
      esvaziamentoExplicito: true,
      motivoDoEsvaziamento: "Descadastro combinado com o profissional.",
    });
    expect(await listCompetencyDomains(client, id)).toEqual([]);

    await client.auth.signOut();
  });

  it("sessão sem papel de administrador não substitui competências e não deixa estado parcial", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const adminSessao = createCuradoriaClient(url, anonKey);
    await adminSessao.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });
    const {
      data: { user },
    } = await adminSessao.auth.getUser();

    const dominios = ["saude_fisica", "saude_emocional_mental"];
    const id = await criarProfissionalComAreas(adminSessao, user!.id, dominios);
    await adminSessao.auth.signOut();

    const paciente = accounts.find((a) => a.role === "paciente")!;
    const sessaoPaciente = createCuradoriaClient(url, anonKey);
    await sessaoPaciente.auth.signInWithPassword({
      email: paciente.email,
      password: paciente.password,
    });

    // A RLS recusa o passo aditivo — e o subtrativo nunca roda (ordem com
    // guarda): nada é apagado, nada é acrescentado.
    await expect(
      replaceCompetencyDomains(sessaoPaciente, id, ["nao_determinado"]),
    ).rejects.toThrow();

    const adminClient = createAdminSupabaseClient();
    const { data: areas } = await adminClient
      .from("professional_competency_areas")
      .select("domain")
      .eq("professional_profile_id", id);
    expect((areas ?? []).map((row) => row.domain).sort()).toEqual([...dominios].sort());

    await sessaoPaciente.auth.signOut();
  });

  it("administrador não consegue atribuir created_by a outra pessoa (defesa em profundidade da RLS)", async () => {
    const administrador = accounts.find((a) => a.role === "administrador")!;
    const paciente = accounts.find((a) => a.role === "paciente")!;

    const pacienteClient = createCuradoriaClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({
      email: paciente.email,
      password: paciente.password,
    });
    const {
      data: { user: pacienteUser },
    } = await pacienteClient.auth.getUser();
    await pacienteClient.auth.signOut();

    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: administrador.email,
      password: administrador.password,
    });

    const { error } = await client.from("professional_profiles").insert({
      display_name: "Tentativa inválida",
      professional_identifier: uniqueIdentifier(),
      created_by: pacienteUser!.id,
    });

    expect(error).not.toBeNull();

    await client.auth.signOut();
  });
});
