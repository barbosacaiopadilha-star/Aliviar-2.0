// GATES DE PARIDADE DO CATÁLOGO CANÔNICO — BLOCO E / FRENTE 1 (Etapa 11).
//
// O que se prova aqui: o Catálogo vigente (1.1.0, ADR-065) tem UMA fonte da verdade (o banco —
// ADR-046 aprova o conteúdo, ADR-047 o torna autoritativo) e todas as cópias
// executáveis (arquivo gerado + módulos de domínio) são espelho exato dela.
// A auditoria encontrou quatro fontes divergentes (AUDITORIA_01 §3.1 D1–D16;
// AUDITORIA_03 §9: 36 códigos de opção divergentes graváveis em silêncio,
// eixo ACESSO×ACESSO_AO_CUIDADO, custo achatado aceitando duas faixas,
// condicionais que ninguém lia, dois defaults de versão).
//
// NUNCA snapshot opaco: cada gate falha nomeando conceito, campo, esperado,
// encontrado e fonte.
//
// Os 12 gates do mandato:
//   1. os 29 códigos ativos
//   2. os 5 eixos (nome vigente + distribuição 4/5/6/12/2)
//   3. a ordem canônica
//   4. os 7 grupos e a filiação
//   5. os tipos de resposta (response_type ↔ kind/multi)
//   6. as 186 opções
//   7. os códigos das opções, por conceito/lado/campo
//   8. as condicionais (uma representação, lida do banco)
//   9. a versão (vigência única; gravação nova = 1.1.0; defaults unificados)
//  10. zero cópia divergente (hash do gerado = hash recomputado do banco vivo)
//  11. custo impossível recusado (duas faixas → recusa no domínio E no banco)
//  12. schema × banco aceitando/rejeitando OS MESMOS valores

import { readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  CATALOGO_EIXOS,
  CATALOGO_GERADO,
  CATALOGO_GERADO_HASH,
  CATALOGO_VERSAO,
  type CatalogoConceito,
} from "@/modules/curadoria/catalogo-gerado";
import {
  EVIDENCE_AXES,
  PRACTICE_CATALOG,
  PRACTICE_CATALOG_VERSION,
  PRACTICE_CONCEPTS_BY_CODE,
  validatePracticeEvidence,
} from "@/modules/curadoria/evidencias-pratica";
import {
  SUBCRITERION_CATALOG,
  activeSubcriteria,
} from "@/modules/curadoria/mapa-prioridades";
import { PERSON_PROTOCOL, PROFESSIONAL_PROTOCOL } from "@/modules/curadoria/protocolos";

// O gerador é importado para recomputar a MESMA carga a partir do banco VIVO
// — é isso que torna a paridade executável, e não uma promessa de comentário.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — módulo .mjs sem declaração de tipos, importado só no teste.
import { hashDaCarga, montarCarga } from "../../scripts/gerar-catalogo-ts.mjs";

import {
  cleanupCuradoriaCertificationFixture,
  createCuradoriaCertificationFixture,
} from "../integration/certificacao-fixture";

const MIGRATION_PARIDADE = path.resolve(
  __dirname,
  "../../supabase/migrations/20260802165000_catalogo_fonte_unica_guardas.sql",
);

type LinhaConceito = {
  code: string;
  group: string;
  axis: string | null;
  name: string;
  description: string;
  display_order: number;
  active: boolean;
  catalog_version: string;
  professional_question: string | null;
  patient_question: string | null;
  response_type: string | null;
  cruzamento: string | null;
  required: boolean;
  conditional_rules: unknown[];
  evidence_source: string | null;
  review_months: number | null;
};

type LinhaOpcao = {
  subcriterion_code: string;
  side: string;
  field: string;
  value: string;
  label: string;
  requires_detail: boolean;
  detail_kind: string | null;
  display_order: number;
  active: boolean;
  catalog_version: string;
  satisfied_by: string[] | null;
};

describe("GATE-E1-CAT [Bloco E/Frente 1] paridade do Catálogo Canônico", () => {
  const service = createAdminSupabaseClient();

  let linhas: LinhaConceito[] = [];
  let opcoes: LinhaOpcao[] = [];
  let cargaDoBanco: CatalogoConceito[] = [];
  let ativosDoBanco: CatalogoConceito[] = [];

  let professionalIds: Record<string, string> = {};
  let alvo: string;

  /** Sequência append-only: a próxima versão válida do conceito para o alvo. */
  async function proximaVersao(subcriterionCode: string): Promise<number> {
    const { data, error } = await service
      .from("practice_evidence")
      .select("version")
      .eq("professional_profile_id", alvo)
      .eq("subcriterion_code", subcriterionCode)
      .order("version", { ascending: false })
      .limit(1);
    if (error) throw new Error(`versão corrente: ${error.message}`);
    return ((data?.[0]?.version as number | undefined) ?? 0) + 1;
  }

  beforeAll(async () => {
    const { data: conceitos, error: erroConceitos } = await service
      .from("method_subcriteria")
      .select(
        'code, "group", name, description, display_order, active, axis, catalog_version, professional_question, patient_question, response_type, cruzamento, required, conditional_rules, evidence_source, review_months',
      );
    if (erroConceitos) throw new Error(`method_subcriteria: ${erroConceitos.message}`);
    linhas = conceitos as LinhaConceito[];

    const { data: linhasOpcao, error: erroOpcoes } = await service
      .from("method_subcriterion_options")
      .select(
        "subcriterion_code, side, field, value, label, requires_detail, detail_kind, display_order, active, catalog_version, satisfied_by",
      );
    if (erroOpcoes) throw new Error(`method_subcriterion_options: ${erroOpcoes.message}`);
    opcoes = linhasOpcao as LinhaOpcao[];

    cargaDoBanco = montarCarga(linhas, opcoes) as CatalogoConceito[];
    ativosDoBanco = cargaDoBanco.filter((c) => c.active);

    ({ professionalIds } = await createCuradoriaCertificationFixture(service));
    alvo = professionalIds["fixture-a"]!;
  }, 120_000);

  afterAll(async () => {
    await cleanupCuradoriaCertificationFixture(service);
  }, 120_000);

  // -------------------------------------------------------------------------
  // 1. Os 29 códigos ativos — banco = gerado = módulos
  // -------------------------------------------------------------------------
  it("gate 1 — os 29 códigos ativos são idênticos no banco, no gerado e nos dois módulos", () => {
    const doBanco = ativosDoBanco.map((c) => c.code).sort();
    const doGerado = CATALOGO_GERADO.filter((c) => c.active)
      .map((c) => c.code)
      .sort();
    const daBase = PRACTICE_CATALOG.map((c) => c.code).sort();
    const doMapa = activeSubcriteria(SUBCRITERION_CATALOG)
      .map((c) => c.code)
      .sort();

    expect(doBanco, "fonte: banco method_subcriteria (active)").toHaveLength(29);
    expect(doGerado, "gerado × banco — regenere com scripts/gerar-catalogo-ts.mjs").toEqual(doBanco);
    expect(daBase, "evidencias-pratica.PRACTICE_CATALOG × banco").toEqual(doBanco);
    expect(doMapa, "mapa-prioridades.SUBCRITERION_CATALOG (ativos) × banco").toEqual(doBanco);
  });

  // -------------------------------------------------------------------------
  // 2. Os 5 eixos — nome vigente e distribuição 4/5/6/12/2
  // -------------------------------------------------------------------------
  it("gate 2 — eixos vigentes (ACESSO_AO_CUIDADO, nunca ACESSO) com distribuição 4/5/6/12/2", () => {
    expect([...EVIDENCE_AXES], "evidencias-pratica.EVIDENCE_AXES × eixos canônicos").toEqual([
      ...CATALOGO_EIXOS,
    ]);

    const distribuicao: Record<string, number> = {};
    for (const conceito of ativosDoBanco) {
      distribuicao[conceito.axis!] = (distribuicao[conceito.axis!] ?? 0) + 1;
    }
    expect(distribuicao, "fonte: banco — distribuição por eixo").toEqual({
      ACESSO_AO_CUIDADO: 4,
      CONTINUIDADE_DO_CUIDADO: 5,
      MODELO_DE_ATENDIMENTO: 6,
      PRATICA_E_TRAJETORIA: 12,
      VIABILIDADE_DE_ACESSO: 2,
    });

    for (const conceito of PRACTICE_CATALOG) {
      const noBanco = ativosDoBanco.find((c) => c.code === conceito.code);
      expect(
        conceito.axis,
        `${conceito.code} · campo axis — esperado (banco): ${noBanco?.axis}, encontrado (TS): ${conceito.axis}`,
      ).toBe(noBanco?.axis);
    }
  });

  // -------------------------------------------------------------------------
  // 3. Ordem canônica — recomputada do banco vivo
  // -------------------------------------------------------------------------
  it("gate 3 — a ordem do gerado e dos módulos é a recomputada do banco (eixo → grupo → display_order)", () => {
    const ordemDoBanco = ativosDoBanco.map((c) => c.code);
    const ordemDoGerado = CATALOGO_GERADO.filter((c) => c.active).map((c) => c.code);
    const ordemDaBase = PRACTICE_CATALOG.map((c) => c.code);
    const ordemDoProtocolo = PROFESSIONAL_PROTOCOL.map((q) => q.concept.code);

    expect(ordemDoGerado, "ordem: gerado × banco recomputado").toEqual(ordemDoBanco);
    expect(ordemDaBase, "ordem: PRACTICE_CATALOG × banco recomputado").toEqual(ordemDoBanco);
    expect(ordemDoProtocolo, "ordem: PROFESSIONAL_PROTOCOL (Q1..Q28) × banco recomputado").toEqual(
      ordemDoBanco,
    );

    for (const conceito of PRACTICE_CATALOG) {
      const noBanco = ativosDoBanco.find((c) => c.code === conceito.code)!;
      expect(
        conceito.displayOrder,
        `${conceito.code} · display_order — esperado (banco): ${noBanco.displayOrder}, encontrado (TS): ${conceito.displayOrder}`,
      ).toBe(noBanco.displayOrder);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Os 7 grupos e a filiação
  // -------------------------------------------------------------------------
  it("gate 4 — os 7 grupos e a filiação de cada conceito batem com o banco", () => {
    const gruposDoBanco = new Set(ativosDoBanco.map((c) => c.group));
    expect([...gruposDoBanco].sort(), "fonte: banco — grupos vigentes").toEqual([
      "ACESSO",
      "CONTINUIDADE_DO_CUIDADO",
      "EXPERIENCIA",
      "FORMACAO",
      "HISTORICO",
      "MODELO_DE_ATENDIMENTO",
      "VIABILIDADE",
    ]);

    for (const entrada of activeSubcriteria(SUBCRITERION_CATALOG)) {
      const noBanco = ativosDoBanco.find((c) => c.code === entrada.code)!;
      expect(
        entrada.group,
        `${entrada.code} · group — esperado (banco): ${noBanco.group}, encontrado (mapa-prioridades): ${entrada.group}`,
      ).toBe(noBanco.group);
    }
  });

  // -------------------------------------------------------------------------
  // 5. Tipos de resposta
  // -------------------------------------------------------------------------
  it("gate 5 — response_type do banco governa kind e multi dos módulos", () => {
    for (const conceito of PRACTICE_CATALOG) {
      const noBanco = ativosDoBanco.find((c) => c.code === conceito.code)!;
      const kindEsperado = noBanco.responseType === "estruturado" ? "FATO_ESTRUTURADO" : "CONDUTA";
      expect(
        conceito.kind,
        `${conceito.code} · kind — response_type do banco é "${noBanco.responseType}", esperado ${kindEsperado}, encontrado ${conceito.kind}`,
      ).toBe(kindEsperado);

      const multiEsperado = noBanco.responseType === "multipla_escolha";
      expect(
        conceito.multi,
        `${conceito.code} · multi — response_type "${noBanco.responseType}" ⇒ multi=${multiEsperado}, encontrado ${conceito.multi}`,
      ).toBe(multiEsperado);
    }
  });

  // -------------------------------------------------------------------------
  // 6. As 186 opções
  // -------------------------------------------------------------------------
  it("gate 6 — o banco tem 186 opções e o gerado as carrega todas", () => {
    expect(opcoes, "fonte: banco method_subcriterion_options").toHaveLength(186);
    const totalNoGerado = CATALOGO_GERADO.reduce(
      (soma, conceito) =>
        soma +
        [...conceito.profissional, ...conceito.paciente].reduce(
          (n, campo) => n + campo.options.length,
          0,
        ),
      0,
    );
    expect(totalNoGerado, "gerado × banco — total de opções").toBe(186);
  });

  // -------------------------------------------------------------------------
  // 7. Os códigos das opções, por conceito/lado/campo
  // -------------------------------------------------------------------------
  it("gate 7 — cada família de códigos de opção do módulo é EXATAMENTE a do banco (lado profissional)", () => {
    for (const noBanco of ativosDoBanco) {
      const conceito = PRACTICE_CONCEPTS_BY_CODE.get(noBanco.code)!;
      const camposDoBanco = new Map(noBanco.profissional.map((campo) => [campo.field, campo]));

      // Campo principal → concept.options.
      const principal = camposDoBanco.get("principal");
      const valoresPrincipais = (principal?.options ?? [])
        .filter((o) => o.active)
        .map((o) => o.value)
        .sort();
      expect(
        Object.keys(conceito.options).sort(),
        `${noBanco.code} · campo principal — esperado (banco): [${valoresPrincipais.join(", ")}], encontrado (TS): [${Object.keys(conceito.options).sort().join(", ")}]`,
      ).toEqual(valoresPrincipais);

      // Rótulo nunca é identidade — mas o rótulo vigente vem do banco.
      for (const opcao of principal?.options ?? []) {
        expect(
          conceito.options[opcao.value],
          `${noBanco.code} · rótulo de ${opcao.value} — esperado (banco): "${opcao.label}"`,
        ).toBe(opcao.label);
      }

      // Campos complementares → concept.fields.
      const complementaresDoBanco = noBanco.profissional
        .filter((campo) => campo.field !== "principal")
        .map((campo) => campo.field)
        .sort();
      const complementaresDoModulo = conceito.fields.map((campo) => campo.field).sort();
      expect(
        complementaresDoModulo,
        `${noBanco.code} · campos complementares — esperado (banco): [${complementaresDoBanco.join(", ")}], encontrado (TS): [${complementaresDoModulo.join(", ")}]`,
      ).toEqual(complementaresDoBanco);

      for (const campo of noBanco.profissional) {
        if (campo.field === "principal") continue;
        const noModulo = conceito.fields.find((c) => c.field === campo.field)!;
        expect(
          Object.keys(noModulo.options).sort(),
          `${noBanco.code} · campo ${campo.field} — códigos esperados (banco): [${campo.options.map((o) => o.value).sort().join(", ")}]`,
        ).toEqual(campo.options.map((o) => o.value).sort());
      }
    }
  });

  it("gate 7b — o lado da pessoa usa os códigos do banco onde o banco os materializa", () => {
    for (const noBanco of ativosDoBanco) {
      if (noBanco.paciente.length === 0) continue;
      const pergunta = PERSON_PROTOCOL.find((p) => p.subcriterionCode === noBanco.code);
      expect(pergunta, `${noBanco.code} tem lado da paciente no banco e nenhuma pergunta em PERSON_PROTOCOL`).toBeTruthy();

      const valoresDoBanco = noBanco.paciente
        .flatMap((campo) => campo.options.filter((o) => o.active).map((o) => o.value))
        .sort();
      expect(
        Object.keys(pergunta!.options).sort(),
        `${noBanco.code} · opções da pessoa — esperado (banco): [${valoresDoBanco.join(", ")}], encontrado (protocolos.ts): [${Object.keys(pergunta!.options).sort().join(", ")}]`,
      ).toEqual(valoresDoBanco);
    }
  });

  // -------------------------------------------------------------------------
  // 8. As condicionais — uma representação, lida do banco
  // -------------------------------------------------------------------------
  it("gate 8 — as conditional_rules do banco são as que os módulos executam", () => {
    for (const noBanco of ativosDoBanco) {
      const conceito = PRACTICE_CONCEPTS_BY_CODE.get(noBanco.code)!;
      expect(
        conceito.conditionalRules,
        `${noBanco.code} · conditional_rules — esperado (banco): ${JSON.stringify(noBanco.conditionalRules)}, encontrado (TS): ${JSON.stringify(conceito.conditionalRules)}`,
      ).toEqual(noBanco.conditionalRules);
    }

    // A prova de comportamento: a regra do banco (require_detail) é executada.
    const recusas = validatePracticeEvidence({
      subcriterionCode: "ACESSO_MODALIDADE",
      options: ["PRIMEIRA_REMOTA_CONDICIONADA"],
      details: {},
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "gate de paridade",
    });
    expect(
      recusas.some((r) => r.includes("PRIMEIRA_REMOTA_CONDICIONADA")),
      `condicional do banco não executada: esperado recusa nomeando PRIMEIRA_REMOTA_CONDICIONADA, encontrado ${JSON.stringify(recusas)}`,
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 9. Versão — vigência única; gravação nova = 1.1.0; defaults unificados
  // -------------------------------------------------------------------------
  it("gate 9 — vigência única 1.1.0; nenhum módulo inventa versão; defaults unificados", async () => {
    for (const conceito of ativosDoBanco) {
      expect(
        conceito.catalogVersion,
        `${conceito.code} · catalog_version — esperado 1.1.0, encontrado ${conceito.catalogVersion}`,
      ).toBe("1.1.0");
    }
    expect(CATALOGO_VERSAO, "gerado × banco — versão vigente").toBe("1.1.0");
    expect(PRACTICE_CATALOG_VERSION, "evidencias-pratica × gerado — versão").toBe(CATALOGO_VERSAO);

    // Gravação nova SEM catalog_version explícito nasce 1.1.0 (default do banco, migration 20260803100000).
    const { data: gravada, error } = await service
      .from("practice_evidence")
      .insert({
        professional_profile_id: alvo,
        subcriterion_code: "ACESSO_DISPONIBILIDADE",
        version: await proximaVersao("ACESSO_DISPONIBILIDADE"),
        options: ["MANHA_DIAS_UTEIS"],
        details: {},
        source_tier: "INSTITUCIONAL",
        source: "gate de paridade — default de versão",
        collected_at: new Date().toISOString(),
        collected_by: "00000000-0000-0000-0000-000000000000",
      })
      .select("catalog_version")
      .single();
    expect(error, `gravação vigente recusada: ${error?.message}`).toBeNull();
    expect(gravada!.catalog_version, "default de catalog_version na gravação nova").toBe("1.1.0");

    // Defaults unificados no schema: a migration de paridade fixa o default de
    // method_subcriteria em 1.0.0 (o ledger local garante que foi aplicada).
    const migration = readFileSync(MIGRATION_PARIDADE, "utf8");
    expect(
      migration.includes("alter column catalog_version set default '1.0.0'"),
      "migration 20260802165000 sem a unificação do default de catalog_version",
    ).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 10. Zero cópia divergente — hash executável
  // -------------------------------------------------------------------------
  it("gate 10 — o hash do gerado é o hash recomputado do banco vivo", () => {
    const hashVivo = hashDaCarga(cargaDoBanco);
    expect(
      CATALOGO_GERADO_HASH,
      `catalogo-gerado.ts divergiu do banco — regenere com scripts/gerar-catalogo-ts.mjs (esperado ${hashVivo}, encontrado ${CATALOGO_GERADO_HASH})`,
    ).toBe(hashVivo);
  });

  // -------------------------------------------------------------------------
  // 10b. Conteúdo VIVO do gerado espelha o banco campo a campo (conceitos).
  // O gate 10 (hash gravado na geração) detecta geração desatualizada, mas
  // NÃO detecta edição manual do arquivo após a geração — o teste de mutação
  // da validação independente do Bloco E provou exatamente esse buraco
  // (label de conceito adulterado no .ts passou 14/14). Este gate fecha:
  // compara o dado exportado em memória, campo a campo, nomeando
  // conceito/campo/esperado/encontrado.
  // -------------------------------------------------------------------------
  it("gate 10b — name/axis/group/active de cada conceito do gerado são EXATAMENTE os do banco", () => {
    const geradoPorCodigo = new Map(CATALOGO_GERADO.map((c) => [c.code, c]));
    for (const noBanco of cargaDoBanco) {
      const noGerado = geradoPorCodigo.get(noBanco.code);
      expect(
        noGerado,
        `${noBanco.code} — presente no banco, ausente do gerado`,
      ).toBeDefined();
      for (const campo of ["name", "axis", "group", "active"] as const) {
        expect(
          noGerado![campo],
          `${noBanco.code} · ${campo} — esperado (banco): ${JSON.stringify(noBanco[campo])}, encontrado (gerado): ${JSON.stringify(noGerado![campo])}`,
        ).toEqual(noBanco[campo]);
      }
    }
  });

  // -------------------------------------------------------------------------
  // 11. Custo impossível recusado — domínio E banco
  // -------------------------------------------------------------------------
  it("gate 11 — duas faixas de custo simultâneas são recusadas pelo domínio e pelo banco", async () => {
    // Domínio: a resposta estruturada com duas faixas não passa.
    const recusas = validatePracticeEvidence({
      subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO",
      options: [],
      details: { faixa: ["ATE_300", "DE_301_A_600"], formas: ["DINHEIRO_OU_PIX"] },
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL",
      source: "gate de paridade",
    });
    expect(
      recusas.some((r) => r.includes("faixa")),
      `domínio aceitou duas faixas — esperado recusa nomeando o campo faixa, encontrado ${JSON.stringify(recusas)}`,
    ).toBe(true);

    // Banco: o trigger recusa o mesmo estado.
    const { error: duasFaixas } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: "VIABILIDADE_CUSTO_E_PAGAMENTO",
      version: await proximaVersao("VIABILIDADE_CUSTO_E_PAGAMENTO"),
      options: [],
      details: { faixa: ["ATE_300", "DE_301_A_600"] },
      source_tier: "INSTITUCIONAL",
      source: "gate de paridade — duas faixas",
      collected_at: new Date().toISOString(),
      collected_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(
      duasFaixas,
      "o banco aceitou duas faixas de custo simultâneas — o estado impossível da AUDITORIA_03 §9 continua gravável",
    ).not.toBeNull();

    // E o custo achatado da cópia antiga (faixas dentro de options[]) também
    // não entra: conceito estruturado não usa options[].
    const { error: achatado } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: "VIABILIDADE_CUSTO_E_PAGAMENTO",
      version: await proximaVersao("VIABILIDADE_CUSTO_E_PAGAMENTO"),
      options: ["FAIXA_ATE_300", "FAIXA_301_A_600"],
      details: {},
      source_tier: "INSTITUCIONAL",
      source: "gate de paridade — custo achatado",
      collected_at: new Date().toISOString(),
      collected_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(achatado, "o banco aceitou o custo achatado em options[]").not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // 12. Schema × banco — os MESMOS valores aceitos e rejeitados
  // -------------------------------------------------------------------------
  it("gate 12 — domínio e banco aceitam o código vigente e recusam o desconhecido, juntos", async () => {
    // Código vigente do banco: os dois aceitam.
    const vigente = {
      subcriterionCode: "CONTINUIDADE_CANAIS",
      options: ["TELEFONE_EM_HORARIO_COMERCIAL"],
      details: { prazo_de_resposta: "MESMO_DIA" },
      conditionNote: null,
      observation: null,
      sourceTier: "INSTITUCIONAL" as const,
      source: "gate de paridade — vigente",
    };
    expect(
      validatePracticeEvidence(vigente),
      "domínio recusou o código vigente TELEFONE_EM_HORARIO_COMERCIAL",
    ).toEqual([]);

    const { error: aceito } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: vigente.subcriterionCode,
      version: await proximaVersao(vigente.subcriterionCode),
      options: vigente.options,
      details: vigente.details,
      source_tier: vigente.sourceTier,
      source: vigente.source,
      collected_at: new Date().toISOString(),
      collected_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(aceito, `banco recusou o código vigente: ${aceito?.message}`).toBeNull();

    // Código da cópia antiga (divergência D5): os dois recusam.
    const legado = {
      ...vigente,
      options: ["TELEFONE_HORARIO_COMERCIAL"],
      details: {},
      source: "gate de paridade — legado",
    };
    expect(
      validatePracticeEvidence(legado).some((r) => r.includes("TELEFONE_HORARIO_COMERCIAL")),
      "domínio aceitou o código legado TELEFONE_HORARIO_COMERCIAL (esperado: recusa nomeada)",
    ).toBe(true);

    const { error: recusado } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: legado.subcriterionCode,
      version: await proximaVersao(legado.subcriterionCode),
      options: legado.options,
      details: {},
      source_tier: legado.sourceTier,
      source: legado.source,
      collected_at: new Date().toISOString(),
      collected_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(
      recusado,
      "o banco aceitou TELEFONE_HORARIO_COMERCIAL — código fora do catálogo gravável em silêncio (AUDITORIA_03 §9)",
    ).not.toBeNull();

    // Conceito desconhecido: os dois recusam (FK no banco, catálogo no domínio).
    expect(
      validatePracticeEvidence({ ...vigente, subcriterionCode: "CONCEITO_QUE_NAO_EXISTE" }).length,
      "domínio aceitou conceito inexistente",
    ).toBeGreaterThan(0);

    const { error: semFk } = await service.from("practice_evidence").insert({
      professional_profile_id: alvo,
      subcriterion_code: "CONCEITO_QUE_NAO_EXISTE",
      version: 1, // conceito órfão: nunca chega à sequência
      options: [],
      details: { registro: "x" },
      source_tier: "INSTITUCIONAL",
      source: "gate de paridade — órfão",
      collected_at: new Date().toISOString(),
      collected_by: "00000000-0000-0000-0000-000000000000",
    });
    expect(
      semFk,
      "o banco aceitou subcriterion_code órfão — a FK para o catálogo não existe (AUDITORIA_03 §9)",
    ).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Guarda da norma: o catálogo é tão protegido quanto o dado que normatiza.
  // -------------------------------------------------------------------------
  it("gate extra — o catálogo não é reescrevível pela service key sem rastro (imutabilidade/autoria)", async () => {
    const { error: updateConceito } = await service
      .from("method_subcriteria")
      .update({ name: "Nome adulterado" })
      .eq("code", "ACESSO_MODALIDADE");
    expect(
      updateConceito,
      "method_subcriteria aceitou UPDATE da service key sem rastro — a norma está menos protegida que o dado",
    ).not.toBeNull();

    const { error: deleteOpcao } = await service
      .from("method_subcriterion_options")
      .delete()
      .eq("subcriterion_code", "ACESSO_MODALIDADE");
    expect(
      deleteOpcao,
      "method_subcriterion_options aceitou DELETE — sair de circulação é active=false, nunca apagar",
    ).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Gate ADR-065 — satisfied_by: a correspondência da leitura relacional
  // mora na fonte única, completa e íntegra
  // -------------------------------------------------------------------------
  it("gate ADR-065 — satisfied_by cobre os conceitos automáticos do eixo relacional e o banco recusa órfão", async () => {
    const AUTOMATICOS_RELACIONAIS = [
      "MODELO_COMUNICACAO",
      "MODELO_ALTERNATIVAS",
      "MODELO_PARTICIPACAO_FAMILIAR",
    ];
    const HUMANOS_RELACIONAIS = [
      "MODELO_DECISAO_COMPARTILHADA",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
    ];

    for (const code of AUTOMATICOS_RELACIONAIS) {
      const daPessoa = opcoes.filter(
        (o) => o.subcriterion_code === code && o.side === "paciente" && o.field === "principal" && o.active,
      );
      expect(daPessoa.length, `${code} sem opções vigentes do lado da pessoa`).toBeGreaterThan(0);

      const condutas = new Set(
        opcoes
          .filter(
            (o) =>
              o.subcriterion_code === code && o.side === "profissional" && o.field === "principal" && o.active,
          )
          .map((o) => o.value),
      );

      for (const opcao of daPessoa) {
        // NAO_TENHO_PREFERENCIA é a única opção da pessoa fora do mecanismo.
        if (opcao.value === "NAO_TENHO_PREFERENCIA") {
          expect(opcao.satisfied_by, `${code}/${opcao.value} — fora do cruzamento, satisfied_by deve ser NULL`).toBeNull();
          continue;
        }
        expect(
          opcao.satisfied_by,
          `${code}/${opcao.value} · satisfied_by ausente — conceito automático sem correspondência declarada`,
        ).not.toBeNull();
        expect(opcao.satisfied_by!.length, `${code}/${opcao.value} · satisfied_by vazio`).toBeGreaterThan(0);
        for (const alvo of opcao.satisfied_by!) {
          if (alvo === "*") continue;
          expect(
            condutas.has(alvo),
            `${code}/${opcao.value} · satisfied_by aponta "${alvo}", que não é conduta vigente do profissional`,
          ).toBe(true);
        }
      }
    }

    // Conceitos humanos jamais carregam correspondência automática.
    for (const code of HUMANOS_RELACIONAIS) {
      const comCorrespondencia = opcoes.filter(
        (o) => o.subcriterion_code === code && o.satisfied_by !== null,
      );
      expect(
        comCorrespondencia.map((o) => o.value),
        `${code} é cruzamento humano — nenhuma opção pode ter satisfied_by`,
      ).toEqual([]);
    }

    // O banco recusa satisfied_by órfão mesmo pela service key.
    const { error: orfao } = await service.from("method_subcriterion_options").insert({
      subcriterion_code: "MODELO_COMUNICACAO",
      side: "paciente",
      field: "principal",
      value: "OPCAO_DE_TESTE_ORFA",
      label: "Opção de teste órfã",
      display_order: 99,
      active: true,
      satisfied_by: ["CONDUTA_QUE_NAO_EXISTE"],
    });
    expect(
      orfao,
      "o banco aceitou satisfied_by apontando conduta inexistente — a guarda satisfied_by_check não está ativa",
    ).not.toBeNull();

    // O default novo está na migration da virada (a antiga permanece histórica).
    const novaMigration = readFileSync(
      path.resolve(process.cwd(), "supabase/migrations/20260803100000_catalogo_1_1_0_leitura_relacional.sql"),
      "utf8",
    );
    expect(
      novaMigration.includes("set default '1.1.0'"),
      "migration 20260803100000 sem a virada do default de catalog_version",
    ).toBe(true);
  });
});
