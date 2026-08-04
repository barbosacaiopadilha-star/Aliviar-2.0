import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * PRIVILÉGIO DAS FUNÇÕES DE GOVERNANÇA — quem pode sequer CHAMAR.
 *
 * `CREATE FUNCTION` concede EXECUTE a PUBLIC por padrão, e PUBLIC inclui
 * `anon`. As migrations 140000/150000 concederam a `authenticated` sem revogar
 * o padrão: as funções eram chamáveis sem sessão. Nenhuma vazava dado — as de
 * escrita recusam quando `auth.uid()` é nulo —, mas a defesa dependia
 * inteiramente do corpo de cada função.
 *
 * Este arquivo prova a camada anterior: o privilégio. E prova, junto, que
 * fechá-la não quebrou nenhum fluxo legítimo — inclusive o único acesso
 * anônimo que é desenho, e não descuido (`versao_vigente`).
 *
 * `anon` é membro de PUBLIC. Logo, `anon` recusado É a prova de que PUBLIC não
 * tem mais o privilégio — não é preciso inspecionar catálogo.
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

/** Recusa por privilégio: a mensagem varia com o caminho, a recusa não. */
const RECUSA = /permission denied|not find the function|does not exist|schema cache/i;

const SLUG = `teste-privilegios-${Date.now()}`;
const TEXTO = "Texto sintético para o teste de privilégios — sem valor jurídico.";

describe("Governança — privilégio de execução das funções", () => {
  const admin = createAdminSupabaseClient();
  let contas: TestAccount[];
  let documentId = "";
  let versionId = "";
  let professionalProfileId = "";

  async function sessao(role: string) {
    const conta = contas.find((c) => c.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    const { error } = await client.auth.signInWithPassword({
      email: conta.email,
      password: conta.password,
    });
    expect(error).toBeNull();
    return client;
  }

  beforeAll(async () => {
    contas = loadTestAccounts();

    const { data: doc, error: docError } = await admin
      .from("legal_documents")
      .insert({
        slug: SLUG,
        nome: "Documento sintético de privilégios",
        audiencia: ["paciente", "profissional"],
        obrigatorio: true,
        revogavel: true,
      })
      .select("id")
      .single();
    if (docError) throw new Error(docError.message);
    documentId = doc!.id as string;

    const { data: versao, error: versaoError } = await admin
      .from("legal_document_versions")
      .insert({ document_id: documentId, versao: "1.0.0", conteudo: TEXTO })
      .select("id")
      .single();
    if (versaoError) throw new Error(versaoError.message);
    versionId = versao!.id as string;

    // Profissional da BASELINE (o mais antigo), nunca criado aqui: a FK do
    // aceite é `restrict` e o aceite é append-only.
    const { data: prof } = await admin
      .from("professional_profiles")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    professionalProfileId = (prof?.id as string) ?? "";
  });

  afterAll(async () => {
    // Aceites são append-only por desenho; o documento sintético é desativado,
    // que é o descarte honesto do que não se remove.
    if (documentId) {
      await admin.from("legal_documents").update({ ativo: false }).eq("id", documentId);
    }
  });

  // -------------------------------------------------------------------------
  // Papel não autorizado: `anon` não chega nem a executar
  // -------------------------------------------------------------------------

  it("anon não executa register_legal_acceptances — a recusa é no privilégio, não no corpo", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.schema("curadoria").rpc("register_legal_acceptances", {
      _version_ids: [versionId],
      _origem: "primeiro_acesso",
      _ip: null,
      _user_agent: null,
      _contexto: {},
    });
    expect(error?.message).toMatch(RECUSA);
    // A recusa antiga vinha de dentro da função ("exige sessão autenticada").
    // Agora nem entra: é a camada anterior que barra.
    expect(error?.message).not.toMatch(/exige sessão autenticada/i);
  });

  it("anon não executa revoke_legal_acceptance", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.schema("curadoria").rpc("revoke_legal_acceptance", {
      _acceptance_id: versionId,
      _motivo: null,
      _ip: null,
      _user_agent: null,
    });
    expect(error?.message).toMatch(RECUSA);
  });

  it("anon não executa register_professional_acceptances", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.schema("curadoria").rpc("register_professional_acceptances", {
      _professional_profile_id: versionId,
      _version_ids: [versionId],
      _forma_de_obtencao: "tentativa anônima",
      _evidencia_ref: null,
      _aceito_em: null,
    });
    expect(error?.message).toMatch(RECUSA);
  });

  it("anon não executa pendencias_legais_do_profissional — a que não validava ator nenhum", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.schema("curadoria").rpc("pendencias_legais_do_profissional", {
      _professional_profile_id: professionalProfileId || versionId,
    });
    expect(error?.message).toMatch(RECUSA);
  });

  // -------------------------------------------------------------------------
  // O acesso anônimo que É desenho — a regressão a evitar
  // -------------------------------------------------------------------------

  it("anon CONTINUA executando versao_vigente — o portal legal público depende disso", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { data, error } = await anon.schema("curadoria").rpc("versao_vigente", {
      _document_id: documentId,
    });
    expect(error).toBeNull();
    // E o que ela devolve é o mesmo texto público que `anon` já lê por SELECT.
    expect((data as Record<string, unknown>)?.conteudo).toBe(TEXTO);
  });

  it("o que versao_vigente entrega a anon, anon já obtinha por SELECT — não há escalonamento", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { data, error } = await anon
      .from("legal_document_versions")
      .select("id, conteudo")
      .eq("id", versionId)
      .single();
    expect(error).toBeNull();
    expect(data!.conteudo).toBe(TEXTO);
  });

  // -------------------------------------------------------------------------
  // Papel autorizado: os fluxos legítimos continuam inteiros
  // -------------------------------------------------------------------------

  it("o paciente continua aceitando — o fluxo legítimo não foi tocado", async () => {
    const paciente = await sessao("paciente");
    const { error } = await paciente.schema("curadoria").rpc("register_legal_acceptances", {
      _version_ids: [versionId],
      _origem: "primeiro_acesso",
      _ip: "203.0.113.30",
      _user_agent: "Mozilla/5.0 (teste privilegios)",
      _contexto: {},
    });
    expect(error).toBeNull();

    const { data } = await paciente
      .from("legal_acceptances")
      .select("id, conteudo_hash, natureza")
      .eq("version_id", versionId)
      .single();
    expect(data!.natureza).toBe("eletronico_pelo_titular");
  });

  it("o paciente continua revogando o próprio aceite", async () => {
    const paciente = await sessao("paciente");
    const { data: aceite } = await paciente
      .from("legal_acceptances")
      .select("id")
      .eq("version_id", versionId)
      .single();

    const { error } = await paciente.schema("curadoria").rpc("revoke_legal_acceptance", {
      _acceptance_id: aceite!.id,
      _motivo: "teste de privilégio",
      _ip: null,
      _user_agent: null,
    });
    expect(error).toBeNull();
  });

  it("a Curadoria continua registrando o aceite do profissional", async () => {
    if (!professionalProfileId) return; // sem Rede local, nada a provar aqui

    const curador = await sessao("curador_medico");
    const { error } = await curador
      .schema("curadoria")
      .rpc("register_professional_acceptances", {
        _professional_profile_id: professionalProfileId,
        _version_ids: [versionId],
        _forma_de_obtencao: "Assinatura em papel digitalizada — teste de privilégios.",
        _evidencia_ref: null,
        _aceito_em: null,
      });
    expect(error).toBeNull();
  });

  it("a Curadoria continua consultando as pendências legais do profissional", async () => {
    if (!professionalProfileId) return;

    const curador = await sessao("curador_medico");
    const { error } = await curador
      .schema("curadoria")
      .rpc("pendencias_legais_do_profissional", {
        _professional_profile_id: professionalProfileId,
      });
    expect(error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Papel dentro da função: a distinção que o privilégio não faz
  // -------------------------------------------------------------------------

  it("o administrador consulta as pendências legais do profissional", async () => {
    if (!professionalProfileId) return;

    const administrador = await sessao("administrador");
    const { error } = await administrador
      .schema("curadoria")
      .rpc("pendencias_legais_do_profissional", {
        _professional_profile_id: professionalProfileId,
      });
    expect(error).toBeNull();
  });

  it.each([
    ["paciente", "paciente"],
    ["profissional", "profissional"],
    ["atendente", "atendente"],
    ["concierge", "concierge"],
  ])("%s autenticado é recusado — authenticated não é autorização", async (_rotulo, papel) => {
    if (!professionalProfileId) return;

    const cliente = await sessao(papel);
    const { error } = await cliente
      .schema("curadoria")
      .rpc("pendencias_legais_do_profissional", {
        _professional_profile_id: professionalProfileId,
      });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/não autorizado/i);
  });

  it("conta autenticada SEM papel algum é recusada", async () => {
    const email = `sem-papel-${Date.now()}@aliviar-conexao.local`;
    const senha = `S3m-Papel-${Date.now()}!`;

    const { data: criada, error: erroCriacao } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });
    expect(erroCriacao).toBeNull();

    try {
      const cliente = createCuradoriaClient(url, anonKey);
      const { error: erroLogin } = await cliente.auth.signInWithPassword({ email, password: senha });
      expect(erroLogin).toBeNull();

      const { error } = await cliente
        .schema("curadoria")
        .rpc("pendencias_legais_do_profissional", {
          _professional_profile_id: professionalProfileId || documentId,
        });
      expect(error?.message).toMatch(/não autorizado/i);
    } finally {
      // A conta é da janela desta suíte: a limpeza a removeria de qualquer
      // forma, mas devolvê-la aqui mantém o teste autossuficiente.
      if (criada?.user?.id) await admin.auth.admin.deleteUser(criada.user.id);
    }
  });

  it("a recusa não revela nada: mesmo erro para UUID existente e inexistente", async () => {
    if (!professionalProfileId) return;

    const paciente = await sessao("paciente");
    const inexistente = "00000000-0000-4000-8000-000000000000";

    const [comReal, comInexistente] = await Promise.all([
      paciente.schema("curadoria").rpc("pendencias_legais_do_profissional", {
        _professional_profile_id: professionalProfileId,
      }),
      paciente.schema("curadoria").rpc("pendencias_legais_do_profissional", {
        _professional_profile_id: inexistente,
      }),
    ]);

    // Indistinguíveis: quem não pode consultar não descobre sequer se o
    // profissional existe.
    expect(comReal.error?.message).toBe(comInexistente.error?.message);
    expect(comReal.error?.code).toBe(comInexistente.error?.code);

    // E a mensagem não entrega o papel necessário, a existência do perfil, nem
    // qualquer documento faltante.
    const mensagem = comReal.error!.message.toLowerCase();
    for (const vazamento of [
      "curador",
      "administrador",
      "curadoria",
      "não existe",
      "perfil",
      "documento",
      "termo",
      SLUG,
    ]) {
      expect(mensagem).not.toContain(vazamento.toLowerCase());
    }
  });

  it("o privilégio fechou a porta, não a regra: paciente autenticado ainda é barrado pelo CORPO", async () => {
    if (!professionalProfileId) return;

    // A distinção que importa: `anon` para na camada de privilégio; o paciente
    // autenticado passa por ela e é recusado pela regra de papel de dentro da
    // função. As duas defesas continuam existindo, cada uma no seu lugar.
    const paciente = await sessao("paciente");
    const { error } = await paciente
      .schema("curadoria")
      .rpc("register_professional_acceptances", {
        _professional_profile_id: professionalProfileId,
        _version_ids: [versionId],
        _forma_de_obtencao: "tentativa indevida do paciente",
        _evidencia_ref: null,
        _aceito_em: null,
      });
    expect(error?.message).toMatch(/Só a Curadoria/i);
  });
});
