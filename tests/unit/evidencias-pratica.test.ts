import { describe, expect, it } from "vitest";

import {
  EVIDENCE_STATUS_LABELS,
  PRACTICE_CATALOG,
  PRACTICE_CATALOG_VERSION,
  PRACTICE_CONCEPTS_BY_CODE,
  evidenceReviewIsDue,
  isPracticeConceptCode,
  validatePracticeEvidence,
  verbalizePracticeEvidence,
  verificationTierRejection,
  type PracticeEvidenceInput,
} from "@/modules/curadoria/evidencias-pratica";

/**
 * BASE DE EVIDÊNCIAS — o Catálogo 1.0.0 congelado, executável.
 *
 * Estes testes são o guarda do congelamento: 28 conceitos, eixos 4/5/5/12/2,
 * viabilidade fora do Motor, validação que recusa o que o contrato recusa, e
 * verbalização que nunca inventa palavra.
 */

function entrada(overrides: Partial<PracticeEvidenceInput> = {}): PracticeEvidenceInput {
  return {
    subcriterionCode: "ACESSO_MODALIDADE",
    options: ["PRESENCIAL", "REMOTO"],
    details: {},
    conditionNote: null,
    observation: null,
    sourceTier: "INSTITUCIONAL",
    source: "Entrevista estruturada com a equipe",
    ...overrides,
  };
}

describe("Catálogo 1.0.0 — o congelamento é verificável", () => {
  it("tem exatamente 28 conceitos, na distribuição congelada 4/5/5/12/2", () => {
    expect(PRACTICE_CATALOG_VERSION).toBe("1.0.0");
    expect(PRACTICE_CATALOG).toHaveLength(28);

    const porEixo = new Map<string, number>();
    for (const conceito of PRACTICE_CATALOG) {
      porEixo.set(conceito.axis, (porEixo.get(conceito.axis) ?? 0) + 1);
    }
    expect(porEixo.get("ACESSO")).toBe(4);
    expect(porEixo.get("CONTINUIDADE_DO_CUIDADO")).toBe(5);
    expect(porEixo.get("MODELO_DE_ATENDIMENTO")).toBe(5);
    expect(porEixo.get("PRATICA_E_TRAJETORIA")).toBe(12);
    expect(porEixo.get("VIABILIDADE_DE_ACESSO")).toBe(2);
  });

  it("códigos são únicos e o índice cobre todos", () => {
    expect(PRACTICE_CONCEPTS_BY_CODE.size).toBe(28);
    expect(isPracticeConceptCode("ACESSO_MODALIDADE")).toBe(true);
    expect(isPracticeConceptCode("ACESSO_IDIOMAS")).toBe(false); // fora por decisão de Método
    expect(isPracticeConceptCode("HISTORICO_REGULARIDADE")).toBe(false); // removido — duplicava registration_status
  });

  it("viabilidade NUNCA participa do Motor — e são exatamente 3 os conceitos fora dele", () => {
    const fora = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA").map((c) => c.code);
    expect(fora.sort()).toEqual([
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "VIABILIDADE_COBERTURA_E_CONVENIO",
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
    ]);
    for (const conceito of PRACTICE_CATALOG) {
      if (conceito.axis === "VIABILIDADE_DE_ACESSO") expect(conceito.motor).toBe("NUNCA");
    }
  });

  it("nenhum rótulo de opção contém adjetivo de qualidade sobre pessoa", () => {
    const proibidos = /excelente|ótim|melhor|acolhedor|humanizad|renomad|especialista de alto/i;
    for (const conceito of PRACTICE_CATALOG) {
      for (const rotulo of Object.values(conceito.options)) {
        expect(rotulo, `${conceito.code}: "${rotulo}"`).not.toMatch(proibidos);
      }
    }
  });

  it("todo conceito de conduta oferece os escapes; todo fato exige details", () => {
    for (const conceito of PRACTICE_CATALOG) {
      if (conceito.kind === "CONDUTA") {
        expect(conceito.options, conceito.code).toHaveProperty("NAO_SEI_INFORMAR");
        expect(conceito.options, conceito.code).toHaveProperty("NAO_SE_APLICA");
      } else {
        expect(conceito.requireDetails, conceito.code).toBe(true);
        expect(Object.keys(conceito.options), conceito.code).toHaveLength(0);
      }
    }
  });
});

describe("Validação — a porta recusa o que o contrato recusa", () => {
  it("resposta válida passa sem recusas", () => {
    expect(validatePracticeEvidence(entrada())).toEqual([]);
  });

  it("código fora do catálogo é recusado nomeando a versão", () => {
    const erros = validatePracticeEvidence(entrada({ subcriterionCode: "ACESSO_IDIOMAS" }));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain("1.0.0");
  });

  it("opção desconhecida e escolha única com duas seleções são recusadas", () => {
    expect(
      validatePracticeEvidence(entrada({ options: ["PRESENCIAL", "TELEPATIA"] })),
    ).toEqual(expect.arrayContaining([expect.stringContaining("TELEPATIA")]));

    expect(
      validatePracticeEvidence(
        entrada({ subcriterionCode: "ACESSO_PRAZO_PARA_CONSULTA", options: ["ATE_7_DIAS", "MAIS_DE_60_DIAS"] }),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("escolha única")]));
  });

  it("'depende' sem condição estruturada não é informação", () => {
    const erros = validatePracticeEvidence(
      entrada({ options: ["PRIMEIRA_REMOTA_CONDICIONADA"], conditionNote: null }),
    );
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining("condição estruturada")]));

    expect(
      validatePracticeEvidence(
        entrada({ options: ["PRIMEIRA_REMOTA_CONDICIONADA"], conditionNote: "Após análise da documentação clínica" }),
      ),
    ).toEqual([]);
  });

  it("convênio sem lista de operadoras é inválido — regra dura do contrato", () => {
    const erros = validatePracticeEvidence(
      entrada({
        subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO",
        options: ["CONVENIOS_SELECIONADOS"],
        details: {},
      }),
    );
    expect(erros).toEqual(expect.arrayContaining([expect.stringContaining("lista de operadoras")]));

    expect(
      validatePracticeEvidence(
        entrada({
          subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO",
          options: ["CONVENIOS_SELECIONADOS"],
          details: { operadoras: ["Operadora X"] },
        }),
      ),
    ).toEqual([]);
  });

  it("fato estruturado exige details e recusa opções", () => {
    expect(
      validatePracticeEvidence(
        entrada({ subcriterionCode: "FORMACAO_GRADUACAO", options: [], details: {} }),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("campos estruturados")]));

    expect(
      validatePracticeEvidence(
        entrada({ subcriterionCode: "FORMACAO_GRADUACAO", options: ["PRESENCIAL"], details: { instituicao: "USP", ano: 2010 } }),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("não usa opções")]));

    expect(
      validatePracticeEvidence(
        entrada({ subcriterionCode: "FORMACAO_GRADUACAO", options: [], details: { instituicao: "USP", ano: 2010 }, sourceTier: "OFICIAL_PRIMARIA" }),
      ),
    ).toEqual([]);
  });

  it("na coleta, só fonte INADEQUADA é recusada — declaração entra como declaração", () => {
    // Autodeclaração de graduação (fonte institucional): entra como declarada.
    expect(
      validatePracticeEvidence(
        entrada({ subcriterionCode: "FORMACAO_GRADUACAO", options: [], details: { instituicao: "USP" }, sourceTier: "PUBLICA_SECUNDARIA" }),
      ),
    ).toEqual([]);

    expect(
      validatePracticeEvidence(entrada({ sourceTier: "INADEQUADA" })),
    ).toEqual(expect.arrayContaining([expect.stringContaining("inadequada")]));
  });

  it("na verificação, a fonte mínima do conceito vale — encontrar não é verificar", () => {
    expect(verificationTierRejection("FORMACAO_GRADUACAO", "PUBLICA_SECUNDARIA")).toContain(
      "OFICIAL_PRIMARIA",
    );
    expect(verificationTierRejection("FORMACAO_GRADUACAO", "OFICIAL_PRIMARIA")).toBeNull();
    expect(verificationTierRejection("CONTINUIDADE_CANAIS", "INSTITUCIONAL")).toBeNull();
  });
});

describe("Validade — revisão pendente é derivação, não estado", () => {
  it("prazo de custo vence em 3 meses; graduação, em 60", () => {
    const coleta = "2026-01-01T00:00:00.000Z";
    expect(evidenceReviewIsDue("VIABILIDADE_CUSTO_E_PAGAMENTO", coleta, "2026-03-15T00:00:00.000Z")).toBe(false);
    expect(evidenceReviewIsDue("VIABILIDADE_CUSTO_E_PAGAMENTO", coleta, "2026-04-02T00:00:00.000Z")).toBe(true);
    expect(evidenceReviewIsDue("FORMACAO_GRADUACAO", coleta, "2030-12-01T00:00:00.000Z")).toBe(false);
    expect(evidenceReviewIsDue("FORMACAO_GRADUACAO", coleta, "2031-01-02T00:00:00.000Z")).toBe(true);
  });

  it("sem referência temporal, nada vence — ausência não vira vencimento", () => {
    expect(evidenceReviewIsDue("VIABILIDADE_CUSTO_E_PAGAMENTO", null, "2030-01-01T00:00:00.000Z")).toBe(false);
  });

  it("os cinco estados persistidos têm rótulo humano", () => {
    expect(Object.keys(EVIDENCE_STATUS_LABELS).sort()).toEqual([
      "desatualizado", "divergente", "nao_localizado", "nao_verificado", "verificado",
    ]);
    expect(EVIDENCE_STATUS_LABELS.nao_verificado).toBe("Declarado, ainda não verificado");
  });
});

describe("Verbalização — repetir o selecionado, nunca inventar", () => {
  it("conduta verbaliza os rótulos canônicos com o estado da informação", () => {
    const frase = verbalizePracticeEvidence({
      subcriterionCode: "CONTINUIDADE_CANAIS",
      options: ["MENSAGEM_COM_EQUIPE_OU_SECRETARIA", "CONTATO_DE_URGENCIA_FORA_DO_HORARIO"],
      details: {},
      conditionNote: null,
      status: "verificado",
      verifiedAt: "2026-07-31T12:00:00.000Z",
    });
    expect(frase).not.toBeNull();
    expect(frase!.text).toBe(
      "Canais entre consultas — prática registrada: Mensagem com a equipe ou secretaria · Contato de urgência fora do horário (verificado em 2026-07-31).",
    );
    expect(frase!.ref).toEqual({
      sourceType: "evidencia_de_pratica",
      subcriterion: "CONTINUIDADE_CANAIS",
      status: "verificado",
      verifiedAt: "2026-07-31T12:00:00.000Z",
    });
  });

  it("declarado sem verificação diz isso na frase — o estado acompanha", () => {
    const frase = verbalizePracticeEvidence({
      subcriterionCode: "ACESSO_MODALIDADE",
      options: ["PRIMEIRA_REMOTA_CONDICIONADA"],
      details: {},
      conditionNote: "Após análise prévia da documentação",
      status: "nao_verificado",
      verifiedAt: null,
    });
    expect(frase!.text).toContain("condição: Após análise prévia da documentação");
    expect(frase!.text).toContain("(declarado, ainda não verificado)");
  });

  it("opção não rastreável = frase não gerada — nunca meia-frase", () => {
    expect(
      verbalizePracticeEvidence({
        subcriterionCode: "ACESSO_MODALIDADE",
        options: ["PRESENCIAL", "OPCAO_FANTASMA"],
        details: {},
        conditionNote: null,
        status: "verificado",
        verifiedAt: "2026-07-31T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("preferências/restrições e viabilidade não geram frase automática — contrato da Matriz", () => {
    expect(
      verbalizePracticeEvidence({
        subcriterionCode: "MODELO_PREFERENCIAS_E_RESTRICOES",
        options: ["REGISTRA_A_RESTRICAO_NO_PRONTUARIO"],
        details: {}, conditionNote: null, status: "verificado", verifiedAt: "2026-07-31T00:00:00.000Z",
      }),
    ).toBeNull();
    expect(
      verbalizePracticeEvidence({
        subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO",
        options: ["FAIXA_ATE_300"],
        details: {}, conditionNote: null, status: "verificado", verifiedAt: "2026-07-31T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("fato estruturado verbaliza os campos como estão, sem interpretação", () => {
    const frase = verbalizePracticeEvidence({
      subcriterionCode: "FORMACAO_RESIDENCIA",
      options: [],
      details: { instituicao: "Hospital X", especialidade: "Ortopedia", ano: 2015 },
      conditionNote: null,
      status: "nao_verificado",
      verifiedAt: null,
    });
    expect(frase!.text).toContain("instituicao: Hospital X");
    expect(frase!.text).toContain("ano: 2015");
    expect(frase!.text).not.toMatch(/excelente|renomad|sólida/i);
  });
});
