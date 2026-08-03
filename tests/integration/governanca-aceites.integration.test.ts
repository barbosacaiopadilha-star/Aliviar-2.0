import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * GOVERNANÇA — a prova jurídica, contra o banco real.
 *
 * O que sustenta um aceite não é o clique: é poder demonstrar, depois, que
 * AQUELA pessoa viu AQUELE texto. Este arquivo prova a cadeia inteira sem
 * depender de nenhum documento jurídico existir — os textos usados aqui são
 * deliberadamente sintéticos, porque a infraestrutura é entregue ANTES da
 * redação oficial.
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

const SLUG = `teste-governanca-${Date.now()}`;
const TEXTO_V1 = "Texto sintético da versão 1 — sem valor jurídico.";
const TEXTO_V2 = "Texto sintético da versão 2 — sem valor jurídico.";

describe("Governança — aceite auditável, imutável e comprovável", () => {
  const admin = createAdminSupabaseClient();
  let documentId = "";
  let versaoV1 = "";
  let versaoV2 = "";
  let professionalProfileId = "";
  let contas: TestAccount[];

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
        nome: "Documento de teste",
        audiencia: ["paciente", "profissional"],
        obrigatorio: true,
        revogavel: true,
      })
      .select("id")
      .single();
    if (docError) throw new Error(docError.message);
    documentId = doc!.id as string;

    const { data: v1, error: v1Error } = await admin
      .from("legal_document_versions")
      .insert({ document_id: documentId, versao: "1.0.0", conteudo: TEXTO_V1 })
      .select("id, conteudo_hash")
      .single();
    if (v1Error) throw new Error(v1Error.message);
    versaoV1 = v1!.id as string;

    // Um profissional da BASELINE, escolhido deterministicamente (o mais
    // antigo) — nunca criado aqui, nunca "o primeiro que aparecer".
    //
    // Duas razões, e as duas foram aprendidas na marra nesta Sprint:
    //  1. criar um seria irremovível — a FK de `legal_acceptances` é
    //     `on delete restrict` e o aceite é append-only, então o profissional
    //     ficaria para sempre e o sentinela acusaria resíduo (com razão);
    //  2. pegar um arbitrário (`limit 1`, sem ordem) pode cair numa linha que
    //     outro teste está criando/alterando na mesma janela — a FK toma lock
    //     na referência, e isso altera o timing dos testes de concorrência do
    //     Connection. Linha estável da baseline não é disputada por ninguém.
    const { data: prof } = await admin
      .from("professional_profiles")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    professionalProfileId = (prof?.id as string) ?? "";
  });

  afterAll(async () => {
    // Aceites, revogações e versões são append-only POR DESENHO — nem a
    // limpeza da suíte os apaga, e é isso que se está provando. O documento
    // sintético fica no banco, inativo, sem custo: desativá-lo é o descarte
    // honesto de um registro que não pode ser removido.
    if (documentId) {
      await admin.from("legal_documents").update({ ativo: false }).eq("id", documentId);
    }
    // O profissional é da baseline: esta suíte não o criou e não o remove.
    // Os aceites registrados sobre ele permanecem — append-only é o desenho,
    // e apagá-los seria destruir exatamente a prova que este arquivo comprova.
  });

  it("o hash é gerado pelo BANCO e corresponde ao SHA-256 real do texto", async () => {
    const { data } = await admin
      .from("legal_document_versions")
      .select("conteudo, conteudo_hash")
      .eq("id", versaoV1)
      .single();

    const esperado = createHash("sha256").update(TEXTO_V1, "utf8").digest("hex");
    expect(data!.conteudo_hash).toBe(esperado);
    // E o texto integral mora no banco: é ele que torna a prova autocontida.
    expect(data!.conteudo).toBe(TEXTO_V1);
  });

  it("versão publicada é imutável: UPDATE e DELETE são recusados", async () => {
    const { error: erroUpdate } = await admin
      .from("legal_document_versions")
      .update({ conteudo: "adulterado" })
      .eq("id", versaoV1);
    expect(erroUpdate?.message).toMatch(/append-only/i);

    const { error: erroDelete } = await admin
      .from("legal_document_versions")
      .delete()
      .eq("id", versaoV1);
    expect(erroDelete?.message).toMatch(/append-only/i);
  });

  it("o paciente aceita informando APENAS a versão — o hash é carimbado pelo servidor", async () => {
    const paciente = await sessao("paciente");
    const { error } = await paciente.schema("curadoria").rpc("register_legal_acceptances", {
      _version_ids: [versaoV1],
      _origem: "primeiro_acesso",
      _ip: "203.0.113.10",
      _user_agent: "Mozilla/5.0 (teste)",
      _contexto: {},
    });
    expect(error).toBeNull();

    const { data } = await paciente
      .from("legal_acceptances")
      .select("conteudo_hash, origem, idioma, natureza, ip, user_agent")
      .eq("version_id", versaoV1)
      .single();

    expect(data!.conteudo_hash).toBe(createHash("sha256").update(TEXTO_V1, "utf8").digest("hex"));
    expect(data!.natureza).toBe("eletronico_pelo_titular");
    expect(data!.origem).toBe("primeiro_acesso");
    // Circunstância do ato registrada — o que torna o aceite auditável.
    expect(data!.ip).toBe("203.0.113.10");
    expect(data!.user_agent).toContain("teste");
  });

  it("aceite é imutável — nem o próprio titular reescreve o próprio ato", async () => {
    const { error } = await admin
      .from("legal_acceptances")
      .update({ conteudo_hash: "forjado" })
      .eq("version_id", versaoV1);
    expect(error?.message).toMatch(/append-only/i);
  });

  it("versão superada não pode ser aceita — o aceite só existe sobre o que vige", async () => {
    const { data: v2, error: v2Error } = await admin
      .from("legal_document_versions")
      .insert({ document_id: documentId, versao: "2.0.0", conteudo: TEXTO_V2 })
      .select("id")
      .single();
    expect(v2Error).toBeNull();
    versaoV2 = v2!.id as string;

    const paciente = await sessao("paciente");
    const { error } = await paciente.schema("curadoria").rpc("register_legal_acceptances", {
      _version_ids: [versaoV1], // já superada pela 2.0.0
      _origem: "portal_da_conta",
      _ip: null,
      _user_agent: null,
      _contexto: {},
    });
    expect(error?.message).toMatch(/não é a vigente/i);
  });

  it("revogar não apaga o aceite — a prova de que houve consentimento sobrevive", async () => {
    const paciente = await sessao("paciente");
    const { data: aceite } = await paciente
      .from("legal_acceptances")
      .select("id")
      .eq("version_id", versaoV1)
      .single();

    const { error } = await paciente.schema("curadoria").rpc("revoke_legal_acceptance", {
      _acceptance_id: aceite!.id,
      _motivo: "teste",
      _ip: null,
      _user_agent: null,
    });
    expect(error).toBeNull();

    const { data: aindaExiste } = await paciente
      .from("legal_acceptances")
      .select("id")
      .eq("id", aceite!.id)
      .maybeSingle();
    expect(aindaExiste).not.toBeNull();
  });

  it("INSERT direto de aceite é recusado no privilégio — a escrita só passa pela RPC", async () => {
    const paciente = await sessao("paciente");
    const { error } = await paciente.from("legal_acceptances").insert({
      version_id: versaoV2,
      conteudo_hash: "forjado",
      origem: "primeiro_acesso",
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/permission denied|violates|row-level/i);
  });

  it("aceite do PROFISSIONAL é registrado pela Curadoria, com a forma de obtenção obrigatória", async () => {
    if (!professionalProfileId) return; // sem Rede local, nada a provar aqui

    const curador = await sessao("curador_medico");

    // Sem a forma de obtenção, o registro não acontece: um aceite sem autor
    // nem circunstância não comprovaria nada.
    const { error: erroSemForma } = await curador
      .schema("curadoria")
      .rpc("register_professional_acceptances", {
        _professional_profile_id: professionalProfileId,
        _version_ids: [versaoV2],
        _forma_de_obtencao: "   ",
        _evidencia_ref: null,
        _aceito_em: null,
      });
    expect(erroSemForma?.message).toMatch(/forma como o aceite foi obtido/i);

    const { error } = await curador
      .schema("curadoria")
      .rpc("register_professional_acceptances", {
        _professional_profile_id: professionalProfileId,
        _version_ids: [versaoV2],
        _forma_de_obtencao: "Assinatura em papel digitalizada na homologação de 03/08.",
        _evidencia_ref: "storage:professional-documents/aceite.pdf",
        _aceito_em: null,
      });
    expect(error).toBeNull();

    const { data } = await curador
      .from("legal_acceptances")
      .select("natureza, registrado_por, forma_de_obtencao, profile_id, professional_profile_id")
      .eq("professional_profile_id", professionalProfileId)
      .eq("version_id", versaoV2)
      .single();

    // A proveniência conta a verdade: registrado pela equipe, com autor —
    // jamais confundido com um aceite eletrônico do próprio titular.
    expect(data!.natureza).toBe("registrado_pela_equipe");
    expect(data!.registrado_por).not.toBeNull();
    expect(data!.forma_de_obtencao).toMatch(/Assinatura em papel/);
    expect(data!.profile_id).toBeNull();
  });

  it("o paciente não registra aceite de profissional — o papel é da Curadoria", async () => {
    if (!professionalProfileId) return;

    const paciente = await sessao("paciente");
    const { error } = await paciente
      .schema("curadoria")
      .rpc("register_professional_acceptances", {
        _professional_profile_id: professionalProfileId,
        _version_ids: [versaoV2],
        _forma_de_obtencao: "tentativa indevida",
        _evidencia_ref: null,
        _aceito_em: null,
      });
    expect(error?.message).toMatch(/Só a Curadoria/i);
  });
});
