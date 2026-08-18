import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * G0-R1 — REGIME DE INSTRUMENTOS RECONSTRUÍDO SOBRE A MAIN ATUAL.
 *
 * O arquivo irmão (`governanca-aceites`) prova o aceite sobre um texto ÚNICO.
 * Aqui se prova a outra metade: um instrumento é renderizado para UM titular,
 * congelado, e o que se assina é ELE — não o modelo com marcadores.
 *
 * Os textos são sintéticos de propósito: a infraestrutura é entregue antes da
 * redação oficial, e nenhum documento jurídico real é publicado por teste.
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

const CARIMBO = Date.now();
const sha256 = (texto: string) => createHash("sha256").update(texto, "utf8").digest("hex");

/** O modelo: marcadores `{{chave}}`, do jeito que a publicação os entrega. */
const MODELO_A = [
  "Instrumento sintético — sem valor jurídico.",
  "Titular: {{nome_completo}}.",
  "Valor: R$ {{valor}}.",
  "Vigência: {{vigencia_meses}} meses.",
].join("\n");

const MODELO_B = "Instrumento sintético com dois assinantes. Titular: {{nome_completo}}.";
const MODELO_LACUNA = "Instrumento com marcador não declarado: {{nao_declarado}}. Titular: {{nome_completo}}.";
const MODELO_PROFISSIONAL = "Termo sintético do profissional. Titular: {{nome_completo}}.";

describe("Governança — G0-R1 regime de Instrumentos", () => {
  const admin = createAdminSupabaseClient();
  const documentosCriados: string[] = [];

  let contas: TestAccount[];
  let pacienteId = "";
  let adminId = "";
  let professionalProfileId = "";

  let versaoA = "";
  let hashVersaoA = "";
  let versaoB = "";
  let versaoAdesao = "";
  let versaoFutura = "";
  let versaoLacuna = "";
  let versaoProfissional = "";

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

  /** Um documento sintético com uma versão — a fixture de todo teste daqui. */
  async function publicar(params: {
    sufixo: string;
    regime: "adesao" | "instrumento";
    conteudo: string;
    audiencia: string[];
    variaveisRequeridas?: unknown[];
    assinantesExigidos?: unknown[];
    escoposRevogaveis?: unknown[];
    revogavel?: boolean;
    effectiveAt?: string;
  }): Promise<{ documentId: string; versionId: string; hash: string }> {
    const { data: doc, error: docError } = await admin
      .from("legal_documents")
      .insert({
        slug: `teste-instrumento-${params.sufixo}-${CARIMBO}`,
        nome: `Documento sintético ${params.sufixo}`,
        audiencia: params.audiencia,
        obrigatorio: true,
        revogavel: params.revogavel ?? false,
        regime: params.regime,
      })
      .select("id")
      .single();
    if (docError) throw new Error(docError.message);
    documentosCriados.push(doc!.id as string);

    const { data: versao, error: versaoError } = await admin
      .from("legal_document_versions")
      .insert({
        document_id: doc!.id,
        versao: "1.0.0",
        conteudo: params.conteudo,
        variaveis_requeridas: params.variaveisRequeridas ?? [],
        assinantes_exigidos: params.assinantesExigidos ?? [],
        escopos_revogaveis: params.escoposRevogaveis ?? [],
        ...(params.effectiveAt ? { effective_at: params.effectiveAt } : {}),
      })
      .select("id, conteudo_hash")
      .single();
    if (versaoError) throw new Error(versaoError.message);

    return {
      documentId: doc!.id as string,
      versionId: versao!.id as string,
      hash: versao!.conteudo_hash as string,
    };
  }

  beforeAll(async () => {
    contas = loadTestAccounts();

    const paciente = await sessao("paciente");
    pacienteId = (await paciente.auth.getUser()).data.user!.id;
    const administrador = await sessao("administrador");
    adminId = (await administrador.auth.getUser()).data.user!.id;

    // Profissional da BASELINE, o mais antigo: nunca criado aqui. A FK é
    // `restrict` e a instância é append-only — criar um deixaria resíduo
    // irremovível, e o sentinela da suíte acusaria (com razão).
    const { data: prof } = await admin
      .from("professional_profiles")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    professionalProfileId = (prof?.id as string) ?? "";

    const a = await publicar({
      sufixo: "a",
      regime: "instrumento",
      conteudo: MODELO_A,
      audiencia: ["paciente"],
      variaveisRequeridas: ["nome_completo", "valor", "vigencia_meses"],
      // Documento NÃO revogável integralmente, mas com escopo revogável: é
      // exatamente a assimetria dos termos do médico (D-4).
      revogavel: false,
      escoposRevogaveis: [{ codigo: "uso_de_imagem", rotulo: "Uso de imagem" }],
    });
    versaoA = a.versionId;
    hashVersaoA = a.hash;

    const b = await publicar({
      sufixo: "b",
      regime: "instrumento",
      conteudo: MODELO_B,
      audiencia: ["paciente"],
      variaveisRequeridas: ["nome_completo"],
      assinantesExigidos: [
        { papel: "titular", ordem: 1, obrigatorio: true },
        { papel: "contratada", ordem: 2, obrigatorio: true, profile_id: adminId },
      ],
    });
    versaoB = b.versionId;

    versaoAdesao = (
      await publicar({
        sufixo: "adesao",
        regime: "adesao",
        conteudo: "Termo de adesão sintético — texto igual para todos.",
        audiencia: ["paciente"],
      })
    ).versionId;

    versaoFutura = (
      await publicar({
        sufixo: "futura",
        regime: "instrumento",
        conteudo: MODELO_B,
        audiencia: ["paciente"],
        variaveisRequeridas: ["nome_completo"],
        effectiveAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).versionId;

    versaoLacuna = (
      await publicar({
        sufixo: "lacuna",
        regime: "instrumento",
        conteudo: MODELO_LACUNA,
        audiencia: ["paciente"],
        // `nao_declarado` NÃO está aqui: o modelo tem marcador que ninguém
        // declarou — o caso que a validação de campo obrigatório não pega.
        variaveisRequeridas: ["nome_completo"],
      })
    ).versionId;

    versaoProfissional = (
      await publicar({
        sufixo: "profissional",
        regime: "instrumento",
        conteudo: MODELO_PROFISSIONAL,
        audiencia: ["profissional"],
        variaveisRequeridas: ["nome_completo"],
      })
    ).versionId;
  });

  afterAll(async () => {
    // Instâncias, assinaturas e rescisões são append-only POR DESENHO — é
    // isso que este arquivo prova, e apagá-las destruiria a prova. Desativar
    // o documento sintético é o descarte honesto do que não se remove.
    for (const documentId of documentosCriados) {
      await admin.from("legal_documents").update({ ativo: false }).eq("id", documentId);
    }
  });

  async function criarInstanciaDoPaciente(
    versionId: string,
    variaveis: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const paciente = await sessao("paciente");
    const { data, error } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versionId,
        _profile_id: pacienteId,
        _variaveis: variaveis,
      });
    expect(error).toBeNull();
    return data as Record<string, unknown>;
  }

  // -------------------------------------------------------------------------

  it("T1 — instância válida nasce congelada, com os DOIS hashes e sem marcador", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "1.234,00",
      vigencia_meses: "6",
    });

    const corpo = instancia.corpo as string;
    // O que distingue instrumento de termo padrão: os dados da pessoa DENTRO
    // do texto assinado.
    expect(corpo).toContain("Fulana Sintética de Teste");
    expect(corpo).toContain("R$ 1.234,00");
    expect(corpo).not.toMatch(/\{\{/);

    // Hash da instância: gerado pelo BANCO sobre o corpo.
    expect(instancia.instancia_hash).toBe(sha256(corpo));
    // Hash da versão-modelo: copiado pelo servidor, prova a procedência.
    expect(instancia.conteudo_hash).toBe(hashVersaoA);
    expect(instancia.instancia_hash).not.toBe(instancia.conteudo_hash);

    expect(instancia.status).toBe("aguardando_assinaturas");
    expect(instancia.assinada_em).toBeNull();
    // O snapshot dos campos, congelado junto.
    expect((instancia.variaveis as Record<string, string>).valor).toBe("1.234,00");

    const { data: assinantes } = await admin
      .from("legal_instance_signers")
      .select("papel, ordem, obrigatorio, profile_id")
      .eq("instance_id", instancia.id as string);
    // Versão sem assinantes declarados: o titular assina, e nunca ninguém.
    expect(assinantes).toHaveLength(1);
    expect(assinantes![0]!.papel).toBe("titular");
    expect(assinantes![0]!.profile_id).toBe(pacienteId);
  });

  it("T2 — documento de ADESÃO não gera instância", async () => {
    const paciente = await sessao("paciente");
    const { error } = await paciente.schema("curadoria").rpc("criar_instancia_de_documento", {
      _version_id: versaoAdesao,
      _profile_id: pacienteId,
      _variaveis: {},
    });
    expect(error?.message).toMatch(/regime adesão/i);
  });

  it("T3 — versão que ainda não entrou em vigor não instrumenta", async () => {
    const paciente = await sessao("paciente");
    const { error } = await paciente.schema("curadoria").rpc("criar_instancia_de_documento", {
      _version_id: versaoFutura,
      _profile_id: pacienteId,
      _variaveis: { nome_completo: "Fulana Sintética de Teste" },
    });
    expect(error?.message).toMatch(/não é a vigente/i);
  });

  it("T4 — instrumento com lacuna não nasce: campo faltando e marcador não declarado", async () => {
    const paciente = await sessao("paciente");

    // (a) campo obrigatório ausente — a mensagem diz QUAL.
    const { error: erroCampo } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoA,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste", valor: "10,00" },
      });
    expect(erroCampo?.message).toMatch(/vigencia_meses/i);

    // (b) campo vazio é ausência, não preenchimento.
    const { error: erroVazio } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoA,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "  ", valor: "10,00", vigencia_meses: "6" },
      });
    expect(erroVazio?.message).toMatch(/não preenchido/i);

    // (c) o caso que a validação de campo não pega: o modelo tem marcador que
    // ninguém declarou. Sem esta guarda, a pessoa assinaria um texto com
    // lacuna visível.
    const { error: erroMarcador } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoLacuna,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste" },
      });
    expect(erroMarcador?.message).toMatch(/marcador não resolvido/i);
  });

  it("T5 — instância congelada: nem o service role reescreve corpo, campos ou hash", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "99,00",
      vigencia_meses: "3",
    });
    const id = instancia.id as string;

    const { error: erroCorpo } = await admin
      .from("legal_document_instances")
      .update({ corpo: "adulterado" })
      .eq("id", id);
    expect(erroCorpo?.message).toMatch(/congelada/i);

    const { error: erroVariaveis } = await admin
      .from("legal_document_instances")
      .update({ variaveis: { nome_completo: "Outra Pessoa" } })
      .eq("id", id);
    expect(erroVariaveis?.message).toMatch(/congelada/i);

    const { error: erroVersao } = await admin
      .from("legal_document_instances")
      .update({ version_id: versaoB })
      .eq("id", id);
    expect(erroVersao?.message).toMatch(/congelada/i);

    const { error: erroDelete } = await admin
      .from("legal_document_instances")
      .delete()
      .eq("id", id);
    expect(erroDelete?.message).toMatch(/append-only/i);
  });

  it("T6 — qualquer campo diferente produz hash diferente; campos iguais, hash igual", async () => {
    const base = {
      nome_completo: "Fulana Sintética de Teste",
      valor: "10,00",
      vigencia_meses: "6",
    };
    const primeira = await criarInstanciaDoPaciente(versaoA, base);
    const igual = await criarInstanciaDoPaciente(versaoA, base);
    const diferente = await criarInstanciaDoPaciente(versaoA, { ...base, valor: "10,01" });

    // Sem chave de idempotência, duas chamadas são dois documentos — mas o
    // hash é função do conteúdo, e só dele.
    expect(primeira.id).not.toBe(igual.id);
    expect(primeira.instancia_hash).toBe(igual.instancia_hash);
    // Um centavo de diferença é outro instrumento.
    expect(diferente.instancia_hash).not.toBe(primeira.instancia_hash);
  });

  it("T7 — a assinatura aponta para o conteúdo e os hashes exatos", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "500,00",
      vigencia_meses: "12",
    });

    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const paciente = await sessao("paciente");
    const { data: ato, error } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
      _declaracao_de_vontade: "Fulana Sintética de Teste",
      _ip: "203.0.113.20",
      _user_agent: "Mozilla/5.0 (teste instrumentos)",
    });
    expect(error).toBeNull();

    const registrado = ato as Record<string, unknown>;
    // A prova é autocontida: os dois hashes carimbados no próprio ato.
    expect(registrado.instancia_hash).toBe(sha256(instancia.corpo as string));
    expect(registrado.instancia_hash).toBe(instancia.instancia_hash);
    expect(registrado.conteudo_hash).toBe(hashVersaoA);
    // Livro único, espécies distintas — e a espécie é derivada, não digitada.
    expect(registrado.especie).toBe("assinatura");
    expect(registrado.instance_id).toBe(instancia.id);
    expect(registrado.natureza).toBe("eletronico_pelo_titular");
    expect(registrado.ip).toBe("203.0.113.20");

    // Assinante único e obrigatório: o instrumento fica assinado.
    const { data: depois } = await admin
      .from("legal_document_instances")
      .select("status, assinada_em, eficaz_de, eficaz_ate")
      .eq("id", instancia.id as string)
      .single();
    expect(depois!.status).toBe("assinado");
    expect(depois!.assinada_em).not.toBeNull();
    // Vigência própria do instrumento: 12 meses a contar da assinatura.
    expect(new Date(depois!.eficaz_ate as string).getTime()).toBeGreaterThan(
      new Date(depois!.eficaz_de as string).getTime(),
    );
  });

  it("T8 — o mesmo assinante não assina duas vezes", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "20,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const paciente = await sessao("paciente");
    const primeira = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });
    expect(primeira.error).toBeNull();

    const segunda = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });
    expect(segunda.error?.message).toMatch(/já assinou|estado assinado/i);
  });

  it("T9 — com dois assinantes, o estado é derivado: só fecha quando todos assinam", async () => {
    const paciente = await sessao("paciente");
    const { data: instancia, error: erroCriacao } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoB,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste" },
      });
    expect(erroCriacao).toBeNull();
    const instanceId = (instancia as Record<string, unknown>).id as string;

    const { data: assinantes } = await admin
      .from("legal_instance_signers")
      .select("id, papel, ordem")
      .eq("instance_id", instanceId)
      .order("ordem");
    expect(assinantes).toHaveLength(2);

    const titular = assinantes!.find((a) => a.papel === "titular")!;
    const contratada = assinantes!.find((a) => a.papel === "contratada")!;

    const { error: erroTitular } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanceId,
      _signer_id: titular.id,
    });
    expect(erroTitular).toBeNull();

    // Um de dois: o instrumento NÃO está assinado, e o estado diz isso.
    const { data: parcial } = await admin
      .from("legal_document_instances")
      .select("status, assinada_em")
      .eq("id", instanceId)
      .single();
    expect(parcial!.status).toBe("aguardando_assinaturas");
    expect(parcial!.assinada_em).toBeNull();

    const administrador = await sessao("administrador");
    const { error: erroContratada } = await administrador
      .schema("curadoria")
      .rpc("assinar_instancia", { _instance_id: instanceId, _signer_id: contratada.id });
    expect(erroContratada).toBeNull();

    const { data: completo } = await admin
      .from("legal_document_instances")
      .select("status, assinada_em")
      .eq("id", instanceId)
      .single();
    expect(completo!.status).toBe("assinado");
    expect(completo!.assinada_em).not.toBeNull();
  });

  it("T10 — revogação por escopo não apaga a assinatura, e independe do flag integral", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "77,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const paciente = await sessao("paciente");
    const { data: ato } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });
    const acceptanceId = (ato as Record<string, unknown>).id as string;

    const { error } = await paciente.schema("curadoria").rpc("revogar_por_escopo", {
      _acceptance_id: acceptanceId,
      _escopo: "uso_de_imagem",
      _motivo: "teste de revogação parcial",
    });
    expect(error).toBeNull();

    // A prova de que houve consentimento sobrevive à revogação.
    const { data: aindaExiste } = await admin
      .from("legal_acceptances")
      .select("id, instancia_hash, especie")
      .eq("id", acceptanceId)
      .maybeSingle();
    expect(aindaExiste).not.toBeNull();
    expect(aindaExiste!.instancia_hash).toBe(instancia.instancia_hash);

    // O documento NÃO é revogável integralmente — e ainda assim o escopo foi
    // revogado. São atos distintos, e é essa a distinção da D-4.
    const { error: erroIntegral } = await paciente
      .schema("curadoria")
      .rpc("revoke_legal_acceptance", {
        _acceptance_id: acceptanceId,
        _motivo: null,
        _ip: null,
        _user_agent: null,
      });
    expect(erroIntegral?.message).toMatch(/não é revogável/i);
  });

  it("T11 — o mesmo escopo não se revoga duas vezes; escopo não declarado é recusado", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "88,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const paciente = await sessao("paciente");
    const { data: ato } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });
    const acceptanceId = (ato as Record<string, unknown>).id as string;

    const primeira = await paciente.schema("curadoria").rpc("revogar_por_escopo", {
      _acceptance_id: acceptanceId,
      _escopo: "uso_de_imagem",
    });
    expect(primeira.error).toBeNull();

    const repetida = await paciente.schema("curadoria").rpc("revogar_por_escopo", {
      _acceptance_id: acceptanceId,
      _escopo: "uso_de_imagem",
    });
    expect(repetida.error?.message).toMatch(/duplicate key|unica/i);

    // Escopo é dado publicado na versão: o sistema não inventa categoria.
    const naoDeclarado = await paciente.schema("curadoria").rpc("revogar_por_escopo", {
      _acceptance_id: acceptanceId,
      _escopo: "escopo_inventado",
    });
    expect(naoDeclarado.error?.message).toMatch(/não é revogável nesta versão/i);
  });

  it("T12 — rescisão encerra o vínculo sem apagar a prova nem reabrir pendência", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "300,00",
      vigencia_meses: "24",
    });
    const instanceId = instancia.id as string;
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanceId)
      .single();

    const paciente = await sessao("paciente");
    await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanceId,
      _signer_id: assinante!.id,
    });

    const { count: antes } = await admin
      .from("legal_acceptances")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", instanceId);

    const administrador = await sessao("administrador");
    const { error } = await administrador.schema("curadoria").rpc("rescindir_instrumento", {
      _instance_id: instanceId,
      _causa: "denuncia_imotivada",
      _motivo: "teste de rescisão",
      _aviso_previo_dias: 30,
      _efeitos_sobreviventes: "Confidencialidade e proteção de dados permanecem.",
    });
    expect(error).toBeNull();

    // A assinatura continua lá: rescindir não é revogar, e o vínculo existiu.
    const { count: depois } = await admin
      .from("legal_acceptances")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", instanceId);
    expect(depois).toBe(antes);

    // Nenhuma revogação foi criada — o ato é de outra natureza.
    const { data: revogacoes } = await admin
      .from("legal_acceptance_revocations")
      .select("id, acceptance_id, legal_acceptances!inner(instance_id)")
      .eq("legal_acceptances.instance_id", instanceId);
    expect(revogacoes ?? []).toHaveLength(0);

    // O instrumento segue assinado; só a eficácia se encerrou.
    const { data: estado } = await admin
      .from("legal_document_instances")
      .select("status, assinada_em, eficaz_ate")
      .eq("id", instanceId)
      .single();
    expect(estado!.status).toBe("assinado");
    expect(estado!.assinada_em).not.toBeNull();
    expect(new Date(estado!.eficaz_ate as string).getTime()).toBeLessThanOrEqual(Date.now() + 1000);

    // Rescindir duas vezes o mesmo instrumento não significa nada.
    const repetida = await administrador.schema("curadoria").rpc("rescindir_instrumento", {
      _instance_id: instanceId,
      _causa: "acordo",
    });
    expect(repetida.error?.message).toMatch(/duplicate key|uma_por_instrumento/i);
  });

  it("T13 — o paciente não alcança instrumento de profissional; anon não alcança nenhum", async () => {
    if (!professionalProfileId) return; // sem Rede local, nada a provar aqui

    const curador = await sessao("curador_medico");
    const { data: instancia, error } = await curador
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoProfissional,
        _professional_profile_id: professionalProfileId,
        _variaveis: { nome_completo: "Dr. Sintético de Teste" },
      });
    expect(error).toBeNull();
    const instanceId = (instancia as Record<string, unknown>).id as string;

    const paciente = await sessao("paciente");
    const { data: vistoPeloPaciente } = await paciente
      .from("legal_document_instances")
      .select("id")
      .eq("id", instanceId);
    expect(vistoPeloPaciente ?? []).toHaveLength(0);

    const { data: assinantesPeloPaciente } = await paciente
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanceId);
    expect(assinantesPeloPaciente ?? []).toHaveLength(0);

    // Sem sessão, o instrumento não existe: documento publicado é público,
    // instrumento assinado nunca é.
    const anon = createCuradoriaClient(url, anonKey);
    const { data: vistoPorAnon } = await anon
      .from("legal_document_instances")
      .select("id")
      .eq("id", instanceId);
    expect(vistoPorAnon ?? []).toHaveLength(0);
  });

  it("T14 — anon não executa nenhuma das funções do regime", async () => {
    const anon = createCuradoriaClient(url, anonKey);

    const criar = await anon.schema("curadoria").rpc("criar_instancia_de_documento", {
      _version_id: versaoA,
      _profile_id: pacienteId,
      _variaveis: { nome_completo: "x", valor: "1", vigencia_meses: "1" },
    });
    expect(criar.error?.message).toMatch(/permission denied|not exist|não/i);

    const assinar = await anon.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: versaoA,
      _signer_id: versaoA,
    });
    expect(assinar.error?.message).toMatch(/permission denied|not exist|não/i);

    const revogar = await anon.schema("curadoria").rpc("revogar_por_escopo", {
      _acceptance_id: versaoA,
      _escopo: "uso_de_imagem",
    });
    expect(revogar.error?.message).toMatch(/permission denied|not exist|não/i);

    const rescindir = await anon.schema("curadoria").rpc("rescindir_instrumento", {
      _instance_id: versaoA,
      _causa: "acordo",
    });
    expect(rescindir.error?.message).toMatch(/permission denied|not exist|não/i);
  });

  it("T15 — o NÍVEL da assinatura é do servidor, nunca do cliente", async () => {
    const { data: perfil } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", pacienteId)
      .single();
    const nomeDoCadastro = (perfil?.display_name as string | null) ?? "";

    // Declaração que NÃO confere com o cadastro: o ato acontece, mas o nível
    // registrado diz a verdade sobre o que foi possível verificar.
    const instanciaA = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "1,00",
      vigencia_meses: "1",
    });
    const { data: assinanteA } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanciaA.id as string)
      .single();

    const paciente = await sessao("paciente");
    const { data: atoDivergente } = await paciente
      .schema("curadoria")
      .rpc("assinar_instancia", {
        _instance_id: instanciaA.id,
        _signer_id: assinanteA!.id,
        _declaracao_de_vontade: "Nome Que Não Confere",
      });
    expect((atoDivergente as Record<string, unknown>).nivel).toBe("N1");

    if (nomeDoCadastro.trim() === "") return; // sem nome no cadastro, N2 é inatingível

    const instanciaB = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "2,00",
      vigencia_meses: "1",
    });
    const { data: assinanteB } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanciaB.id as string)
      .single();

    const { data: atoConferido } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanciaB.id,
      _signer_id: assinanteB!.id,
      _declaracao_de_vontade: nomeDoCadastro,
    });
    expect((atoConferido as Record<string, unknown>).nivel).toBe("N2");
    expect((atoConferido as Record<string, unknown>).declaracao_de_vontade).toBe(nomeDoCadastro);
  });

  it("T16 — instrumento assinado não recebe assinatura nova nem retrocede de estado", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "44,00",
      vigencia_meses: "6",
    });
    const instanceId = instancia.id as string;
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanceId)
      .single();

    const paciente = await sessao("paciente");
    await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanceId,
      _signer_id: assinante!.id,
    });

    // Nem o service role devolve um instrumento assinado ao estado anterior.
    const { error: erroRetrocesso } = await admin
      .from("legal_document_instances")
      .update({ status: "aguardando_assinaturas", assinada_em: null })
      .eq("id", instanceId);
    expect(erroRetrocesso?.message).toMatch(/não muda de estado/i);

    // E a lista de assinantes exigidos não cresce depois do ato.
    const { error: erroAssinante } = await admin.from("legal_instance_signers").insert({
      instance_id: instanceId,
      papel: "testemunha",
      ordem: 9,
    });
    expect(erroAssinante?.message).toMatch(/já assinado|imutável/i);
  });

  it("T17 — a idempotência só existe quando declarada", async () => {
    const chave = `teste-idempotencia-${CARIMBO}`;
    const paciente = await sessao("paciente");

    const primeira = await paciente.schema("curadoria").rpc("criar_instancia_de_documento", {
      _version_id: versaoA,
      _profile_id: pacienteId,
      _variaveis: { nome_completo: "Fulana Sintética de Teste", valor: "5,00", vigencia_meses: "2" },
      _idempotency_key: chave,
    });
    expect(primeira.error).toBeNull();

    const repetida = await paciente.schema("curadoria").rpc("criar_instancia_de_documento", {
      _version_id: versaoA,
      _profile_id: pacienteId,
      _variaveis: { nome_completo: "Fulana Sintética de Teste", valor: "5,00", vigencia_meses: "2" },
      _idempotency_key: chave,
    });
    expect(repetida.error).toBeNull();

    // Mesma chave, mesma instância — nunca uma segunda proposta silenciosa.
    expect((repetida.data as Record<string, unknown>).id).toBe(
      (primeira.data as Record<string, unknown>).id,
    );
  });

  // ---------------------------------------------------------------------------
  // Autorização negativa e concorrência — o que a revisão do G0.1 exigiu provar
  // ---------------------------------------------------------------------------

  it("T18 — autenticado que não é o titular não cria nem assina instrumento alheio", async () => {
    const atendente = await sessao("atendente");

    // Criar EM NOME de outra pessoa: recusado. Não é papel de equipe qualquer.
    const { error: erroCriacao } = await atendente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoA,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste", valor: "1,00", vigencia_meses: "1" },
      });
    expect(erroCriacao?.message).toMatch(/não autorizado/i);

    // Assinar pelo titular: recusado mesmo conhecendo os dois identificadores.
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "60,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const { error: erroAssinatura } = await atendente
      .schema("curadoria")
      .rpc("assinar_instancia", {
        _instance_id: instancia.id,
        _signer_id: assinante!.id,
      });
    expect(erroAssinatura?.message).toMatch(/só o próprio assinante/i);

    // E o instrumento continua intocado: nenhuma assinatura foi registrada.
    const { count } = await admin
      .from("legal_acceptances")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", instancia.id as string);
    expect(count).toBe(0);
  });

  it("T19 — membro da equipe sem o papel apropriado é recusado", async () => {
    if (!professionalProfileId) return;

    const atendente = await sessao("atendente");

    // Instrumentar um profissional é ato da Curadoria ou do administrador.
    const { error: erroProfissional } = await atendente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoProfissional,
        _professional_profile_id: professionalProfileId,
        _variaveis: { nome_completo: "Dr. Sintético de Teste" },
      });
    expect(erroProfissional?.message).toMatch(/não autorizado/i);

    // Rescindir também não é de qualquer papel interno.
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "70,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();
    const paciente = await sessao("paciente");
    await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });

    const { error: erroRescisao } = await atendente
      .schema("curadoria")
      .rpc("rescindir_instrumento", { _instance_id: instancia.id, _causa: "acordo" });
    expect(erroRescisao?.message).toMatch(/não autorizado/i);
  });

  it("T20 — duas assinaturas concorrentes do mesmo assinante produzem UM ato", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "111,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    // Duas sessões independentes do MESMO titular — o duplo clique real.
    const [sessaoA, sessaoB] = await Promise.all([sessao("paciente"), sessao("paciente")]);
    const resultados = await Promise.all([
      sessaoA.schema("curadoria").rpc("assinar_instancia", {
        _instance_id: instancia.id,
        _signer_id: assinante!.id,
      }),
      sessaoB.schema("curadoria").rpc("assinar_instancia", {
        _instance_id: instancia.id,
        _signer_id: assinante!.id,
      }),
    ]);

    expect(resultados.filter((r) => r.error === null)).toHaveLength(1);
    const { count } = await admin
      .from("legal_acceptances")
      .select("id", { count: "exact", head: true })
      .eq("signer_id", assinante!.id);
    expect(count).toBe(1);
  });

  it("T21 — duas criações concorrentes com a mesma chave produzem UMA instância", async () => {
    const chave = `teste-idempotencia-concorrente-${CARIMBO}`;
    const variaveis = {
      nome_completo: "Fulana Sintética de Teste",
      valor: "222,00",
      vigencia_meses: "6",
    };

    const [sessaoA, sessaoB] = await Promise.all([sessao("paciente"), sessao("paciente")]);
    const resultados = await Promise.all([
      sessaoA.schema("curadoria").rpc("criar_instancia_de_documento", {
        _version_id: versaoA,
        _profile_id: pacienteId,
        _variaveis: variaveis,
        _idempotency_key: chave,
      }),
      sessaoB.schema("curadoria").rpc("criar_instancia_de_documento", {
        _version_id: versaoA,
        _profile_id: pacienteId,
        _variaveis: variaveis,
        _idempotency_key: chave,
      }),
    ]);

    // Quem perde a corrida recebe a instância vencedora, nunca um erro.
    for (const resultado of resultados) expect(resultado.error).toBeNull();
    const ids = resultados.map((r) => (r.data as Record<string, unknown>).id);
    expect(ids[0]).toBe(ids[1]);

    const { count } = await admin
      .from("legal_document_instances")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", chave);
    expect(count).toBe(1);

    // E os assinantes não foram duplicados pelo perdedor da corrida.
    const { count: assinantes } = await admin
      .from("legal_instance_signers")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", ids[0] as string);
    expect(assinantes).toBe(1);
  });

  it("T22 — duas revogações concorrentes do mesmo escopo produzem UMA", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "333,00",
      vigencia_meses: "6",
    });
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instancia.id as string)
      .single();

    const paciente = await sessao("paciente");
    const { data: ato } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instancia.id,
      _signer_id: assinante!.id,
    });
    const acceptanceId = (ato as Record<string, unknown>).id as string;

    const [sessaoA, sessaoB] = await Promise.all([sessao("paciente"), sessao("paciente")]);
    const resultados = await Promise.all([
      sessaoA.schema("curadoria").rpc("revogar_por_escopo", {
        _acceptance_id: acceptanceId,
        _escopo: "uso_de_imagem",
      }),
      sessaoB.schema("curadoria").rpc("revogar_por_escopo", {
        _acceptance_id: acceptanceId,
        _escopo: "uso_de_imagem",
      }),
    ]);
    expect(resultados.filter((r) => r.error === null)).toHaveLength(1);

    const { count } = await admin
      .from("legal_acceptance_revocations")
      .select("id", { count: "exact", head: true })
      .eq("acceptance_id", acceptanceId);
    expect(count).toBe(1);
  });

  it("T23 — duas rescisões concorrentes produzem UMA", async () => {
    const instancia = await criarInstanciaDoPaciente(versaoA, {
      nome_completo: "Fulana Sintética de Teste",
      valor: "444,00",
      vigencia_meses: "6",
    });
    const instanceId = instancia.id as string;
    const { data: assinante } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanceId)
      .single();

    const paciente = await sessao("paciente");
    await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanceId,
      _signer_id: assinante!.id,
    });

    const [sessaoA, sessaoB] = await Promise.all([
      sessao("administrador"),
      sessao("administrador"),
    ]);
    const resultados = await Promise.all([
      sessaoA.schema("curadoria").rpc("rescindir_instrumento", {
        _instance_id: instanceId,
        _causa: "acordo",
      }),
      sessaoB.schema("curadoria").rpc("rescindir_instrumento", {
        _instance_id: instanceId,
        _causa: "acordo",
      }),
    ]);
    expect(resultados.filter((r) => r.error === null)).toHaveLength(1);

    const { count } = await admin
      .from("legal_instrument_terminations")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", instanceId);
    expect(count).toBe(1);
  });

  it("T24 — assinar no papel de outro assinante é recusado", async () => {
    const paciente = await sessao("paciente");
    const { data: instancia } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoB,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste" },
      });
    const instanceId = (instancia as Record<string, unknown>).id as string;

    const { data: contratada } = await admin
      .from("legal_instance_signers")
      .select("id")
      .eq("instance_id", instanceId)
      .eq("papel", "contratada")
      .single();

    // O titular tenta assinar no lugar da CONTRATADA: o papel é de outro
    // sujeito, e o servidor recusa — não é o cliente que decide quem é quem.
    const { error } = await paciente.schema("curadoria").rpc("assinar_instancia", {
      _instance_id: instanceId,
      _signer_id: contratada!.id,
    });
    expect(error?.message).toMatch(/só o próprio assinante/i);
  });

  it("T25 — o cliente não escreve instância nem ato: nem hash, nem nível, nem nada", async () => {
    const paciente = await sessao("paciente");

    // Não há parâmetro de hash em nenhuma das funções; a única via de escrita
    // seria o INSERT direto — e ele não é concedido a `authenticated`.
    const { error: erroInstancia } = await paciente.from("legal_document_instances").insert({
      version_id: versaoA,
      profile_id: pacienteId,
      corpo: "corpo forjado",
      conteudo_hash: "forjado",
    });
    expect(erroInstancia?.message).toMatch(/permission denied|violates|row-level/i);

    const { error: erroAssinante } = await paciente.from("legal_instance_signers").insert({
      instance_id: versaoA,
      papel: "titular",
    });
    expect(erroAssinante?.message).toMatch(/permission denied|violates|row-level/i);

    const { error: erroRescisao } = await paciente.from("legal_instrument_terminations").insert({
      instance_id: versaoA,
      causa: "acordo",
    });
    expect(erroRescisao?.message).toMatch(/permission denied|violates|row-level/i);
  });

  it("T26 — os dois últimos assinantes assinando ao mesmo tempo fecham o instrumento", async () => {
    // A prova do lock: sem ele, cada transação contaria apenas a própria
    // assinatura e o instrumento ficaria "aguardando" com todos já assinados.
    const paciente = await sessao("paciente");
    const { data: instancia } = await paciente
      .schema("curadoria")
      .rpc("criar_instancia_de_documento", {
        _version_id: versaoB,
        _profile_id: pacienteId,
        _variaveis: { nome_completo: "Fulana Sintética de Teste" },
      });
    const instanceId = (instancia as Record<string, unknown>).id as string;

    const { data: assinantes } = await admin
      .from("legal_instance_signers")
      .select("id, papel")
      .eq("instance_id", instanceId);
    const titular = assinantes!.find((a) => a.papel === "titular")!;
    const contratada = assinantes!.find((a) => a.papel === "contratada")!;

    const [sessaoTitular, sessaoContratada] = await Promise.all([
      sessao("paciente"),
      sessao("administrador"),
    ]);
    const resultados = await Promise.all([
      sessaoTitular.schema("curadoria").rpc("assinar_instancia", {
        _instance_id: instanceId,
        _signer_id: titular.id,
      }),
      sessaoContratada.schema("curadoria").rpc("assinar_instancia", {
        _instance_id: instanceId,
        _signer_id: contratada.id,
      }),
    ]);
    for (const resultado of resultados) expect(resultado.error).toBeNull();

    const { data: estado } = await admin
      .from("legal_document_instances")
      .select("status, assinada_em")
      .eq("id", instanceId)
      .single();
    expect(estado!.status).toBe("assinado");
    expect(estado!.assinada_em).not.toBeNull();
  });
});
