/**
 * MOTOR DE COMPATIBILIDADE RELACIONAL — as guardas da ADR-065.
 *
 * O que se pina: os seis conceitos do eixo, a matriz 4×3 célula a célula, a
 * derivação do estado (§7.1 do documento normativo), a sinalização humana
 * fora da escala, o resumo que só conta, e a recusa de importância no lugar
 * de grau (a colisão de escalas não volta por porta nova).
 */

import { describe, expect, it } from "vitest";

import {
  AGUARDA_JUIZO_DO_CURADOR,
  MATRIZ_RELACIONAL,
  RELATIONAL_CONCEPTS,
  RELATIONAL_STATES,
  crossRelational,
  crossRelationalConcept,
  deriveRelationalState,
  isRelationalConceptCode,
  relationalSummary,
  relationalSummarySentence,
  type RelationalNeed,
} from "@/modules/curadoria/motor-relacional";
import { NEED_DEGREES } from "@/modules/curadoria/protocolos";

const COMUNICACAO = RELATIONAL_CONCEPTS.find((c) => c.code === "MODELO_COMUNICACAO")!;
const FAMILIAR = RELATIONAL_CONCEPTS.find((c) => c.code === "MODELO_PARTICIPACAO_FAMILIAR")!;
const DECISAO = RELATIONAL_CONCEPTS.find((c) => c.code === "MODELO_DECISAO_COMPARTILHADA")!;
const PREFERENCIAS = RELATIONAL_CONCEPTS.find((c) => c.code === "MODELO_PREFERENCIAS_E_RESTRICOES")!;
const NOTICIAS = RELATIONAL_CONCEPTS.find((c) => c.code === "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS")!;

function need(overrides: Partial<RelationalNeed> & { subcriterionCode: string }): RelationalNeed {
  return { options: [], degree: "ESSENCIAL", ...overrides };
}

describe("O universo da leitura — derivado do eixo, nunca de lista paralela", () => {
  it("são exatamente os 6 conceitos do eixo MODELO_DE_ATENDIMENTO, na ordem do Catálogo", () => {
    expect(RELATIONAL_CONCEPTS.map((c) => c.code)).toEqual([
      "MODELO_COMUNICACAO",
      "MODELO_DECISAO_COMPARTILHADA",
      "MODELO_PARTICIPACAO_FAMILIAR",
      "MODELO_ALTERNATIVAS",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
    ]);
    expect(isRelationalConceptCode("MODELO_COMUNICACAO")).toBe(true);
    expect(isRelationalConceptCode("CONTINUIDADE_CANAIS")).toBe(false); // assistencial — ADR-065 A.7
    expect(isRelationalConceptCode("ACESSO_MODALIDADE")).toBe(false);
  });

  it("três conceitos são humanos e três são automáticos — decisão do Catálogo, não deste módulo", () => {
    const humanos = RELATIONAL_CONCEPTS.filter((c) => c.cruzamento === "humano").map((c) => c.code);
    expect(humanos.sort()).toEqual([
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "MODELO_DECISAO_COMPARTILHADA",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
    ]);
  });
});

describe("A matriz — doze células escritas, nenhuma calculada", () => {
  it("é exatamente a matriz do documento normativo (Parte 5.2)", () => {
    expect(MATRIZ_RELACIONAL).toEqual({
      ESSENCIAL: {
        CONFIRMADO: "ALTA_COMPATIBILIDADE",
        NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE",
        NAO_INFORMADO: "LACUNA_DE_INFORMACAO",
      },
      PESA_MUITO: {
        CONFIRMADO: "ALTA_COMPATIBILIDADE",
        NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE",
        NAO_INFORMADO: "LACUNA_DE_INFORMACAO",
      },
      DESEJAVEL: {
        CONFIRMADO: "MEDIA_COMPATIBILIDADE",
        NAO_CONFIRMADO: "MEDIA_COMPATIBILIDADE",
        NAO_INFORMADO: "LACUNA_DE_INFORMACAO",
      },
      SEM_PREFERENCIA: {
        CONFIRMADO: "NAO_RELEVANTE",
        NAO_CONFIRMADO: "NAO_RELEVANTE",
        NAO_INFORMADO: "NAO_RELEVANTE",
      },
    });
  });

  it("cobre todos os graus e todos os estados — nenhuma célula ausente", () => {
    for (const degree of NEED_DEGREES) {
      for (const state of RELATIONAL_STATES) {
        expect(MATRIZ_RELACIONAL[degree][state], `${degree} × ${state}`).toBeDefined();
      }
    }
  });

  it("ausência nunca elimina: nenhuma célula produz eliminação, e NAO_CONFIRMADO nunca passa de MÉDIA", () => {
    for (const degree of NEED_DEGREES) {
      expect(["MEDIA_COMPATIBILIDADE", "NAO_RELEVANTE"]).toContain(
        MATRIZ_RELACIONAL[degree].NAO_CONFIRMADO,
      );
    }
  });
});

describe("Derivação do estado — §7.1, com o par preservado", () => {
  it("sem evidência vigente → NAO_INFORMADO", () => {
    const { state } = deriveRelationalState(COMUNICACAO, ["QUE_CONFIRMEM_SE_ENTENDI"], null);
    expect(state).toBe("NAO_INFORMADO");
  });

  it("pergunta respondida sem a conduta correspondente → NAO_CONFIRMADO (fato declarado, não lacuna)", () => {
    const { state, matches } = deriveRelationalState(
      COMUNICACAO,
      ["QUE_CONFIRMEM_SE_ENTENDI", "ALGO_ESCRITO_PARA_LEVAR"],
      { subcriterionCode: "MODELO_COMUNICACAO", options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU"] },
    );
    expect(state).toBe("NAO_CONFIRMADO");
    expect(matches.find((m) => m.personOption === "QUE_CONFIRMEM_SE_ENTENDI")).toMatchObject({
      satisfied: true,
      matchedConducts: ["VERIFICA_SE_A_PESSOA_COMPREENDEU"],
    });
    expect(matches.find((m) => m.personOption === "ALGO_ESCRITO_PARA_LEVAR")).toMatchObject({
      satisfied: false,
      matchedConducts: [],
    });
  });

  it("toda opção pedida com correspondência declarada → CONFIRMADO", () => {
    const { state } = deriveRelationalState(
      COMUNICACAO,
      ["QUE_CONFIRMEM_SE_ENTENDI", "TEMPO_PARA_PERGUNTAR"],
      {
        subcriterionCode: "MODELO_COMUNICACAO",
        options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU", "RESERVA_TEMPO_PARA_PERGUNTAS"],
      },
    );
    expect(state).toBe("CONFIRMADO");
  });

  it("a correspondência é por identidade de código — sinônimo declarado à mão não satisfaz", () => {
    const { state } = deriveRelationalState(COMUNICACAO, ["ALGO_ESCRITO_PARA_LEVAR"], {
      subcriterionCode: "MODELO_COMUNICACAO",
      options: ["ENVIA_RESUMO_POR_ESCRITO_INVENTADO"],
    });
    expect(state).toBe("NAO_CONFIRMADO");
  });

  it('"*" é correspondência universal: PREFIRO_SOZINHA é satisfeita por qualquer declaração vigente', () => {
    const { state, matches } = deriveRelationalState(FAMILIAR, ["PREFIRO_SOZINHA"], {
      subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR",
      options: ["ATENDIMENTO_APENAS_INDIVIDUAL"],
    });
    expect(state).toBe("CONFIRMADO");
    expect(matches[0]!.satisfied).toBe(true);
  });

  it("NAO_TENHO_PREFERENCIA fica fora do mecanismo — não derruba nem confirma o estado", () => {
    const { state, matches } = deriveRelationalState(
      FAMILIAR,
      ["NAO_TENHO_PREFERENCIA", "QUERO_ACOMPANHANTE_SEMPRE"],
      { subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", options: ["ACOMPANHANTE_BEM_VINDO_SEMPRE"] },
    );
    expect(state).toBe("CONFIRMADO");
    expect(matches.map((m) => m.personOption)).toEqual(["QUERO_ACOMPANHANTE_SEMPRE"]);
  });

  it("apenas individual declarado não satisfaz quem quer acompanhante — registra o fato, não elimina", () => {
    const reading = crossRelationalConcept(
      FAMILIAR,
      need({ subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", options: ["QUERO_ACOMPANHANTE_SEMPRE"], degree: "ESSENCIAL" }),
      { subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", options: ["ATENDIMENTO_APENAS_INDIVIDUAL"] },
    );
    expect(reading).toMatchObject({ kind: "CELULA", state: "NAO_CONFIRMADO", result: "MEDIA_COMPATIBILIDADE" });
  });
});

describe("Conceitos humanos — sinalização, nunca célula", () => {
  it("decisão compartilhada, preferências e notícias difíceis emitem AGUARDA_JUIZO_DO_CURADOR", () => {
    for (const concept of [DECISAO, PREFERENCIAS, NOTICIAS]) {
      const reading = crossRelationalConcept(
        concept,
        need({ subcriterionCode: concept.code, options: [], degree: "PESA_MUITO" }),
        { subcriterionCode: concept.code, options: ["QUALQUER_CONDUTA"] },
      );
      expect(reading, concept.code).toMatchObject({
        kind: "JUIZO_HUMANO",
        signal: AGUARDA_JUIZO_DO_CURADOR,
        hasEvidence: true,
      });
      expect(reading && "result" in reading).toBe(false);
    }
  });

  it("a lacuna não some por ser conceito humano — hasEvidence diz a verdade", () => {
    const reading = crossRelationalConcept(
      DECISAO,
      need({ subcriterionCode: DECISAO.code, options: ["QUERO_DECIDIR_COM_ORIENTACAO"] }),
      null,
    );
    expect(reading).toMatchObject({ kind: "JUIZO_HUMANO", hasEvidence: false });
  });

  it("o texto guiado da pessoa (P14) chega íntegro ao Curador — nunca a um motor", () => {
    const reading = crossRelationalConcept(
      PREFERENCIAS,
      need({
        subcriterionCode: PREFERENCIAS.code,
        guidedText: "Não aceito transfusão de sangue.",
      }),
      { subcriterionCode: PREFERENCIAS.code, options: ["REGISTRA_A_RESTRICAO_NO_PRONTUARIO"] },
    );
    expect(reading).toMatchObject({
      kind: "JUIZO_HUMANO",
      personGuidedText: "Não aceito transfusão de sangue.",
    });
  });
});

describe("Grau nunca é importância — a colisão de escalas não volta", () => {
  it("recusa IMPORTANTE e MUITO_IMPORTANTE nomeando a regra", () => {
    for (const importancia of ["IMPORTANTE", "MUITO_IMPORTANTE", "RELEVANTE", "NAO_INFLUENCIA"]) {
      expect(() =>
        crossRelationalConcept(
          COMUNICACAO,
          { subcriterionCode: COMUNICACAO.code, options: [], degree: importancia as never },
          null,
        ),
      ).toThrow(/importância do Case/);
    }
  });
});

describe("O cruzamento completo e o resumo — conta ocorrências e nada mais", () => {
  const needs: RelationalNeed[] = [
    { subcriterionCode: "MODELO_COMUNICACAO", options: ["QUE_CONFIRMEM_SE_ENTENDI"], degree: "ESSENCIAL" },
    { subcriterionCode: "MODELO_ALTERNATIVAS", options: ["RISCOS_DE_CADA_CAMINHO"], degree: "DESEJAVEL" },
    { subcriterionCode: "MODELO_DECISAO_COMPARTILHADA", options: ["QUERO_DECIDIR_COM_ORIENTACAO"], degree: "ESSENCIAL" },
  ];
  const evidence = new Map([
    [
      "MODELO_COMUNICACAO",
      { subcriterionCode: "MODELO_COMUNICACAO", options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU"] },
    ],
  ]);

  it("conceito sem resposta da pessoa fica FORA do cruzamento — nunca inferido", () => {
    const { readings, notAnsweredByPerson } = crossRelational(needs, evidence);
    expect(readings.map((r) => r.code)).toEqual([
      "MODELO_COMUNICACAO",
      "MODELO_DECISAO_COMPARTILHADA",
      "MODELO_ALTERNATIVAS",
    ]);
    expect(notAnsweredByPerson.sort()).toEqual([
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "MODELO_PARTICIPACAO_FAMILIAR",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
    ]);
  });

  it("o resumo conta — e a frase não soma, não ordena, não compara", () => {
    const { readings } = crossRelational(needs, evidence);
    const summary = relationalSummary(readings);
    expect(summary).toEqual({ altas: 1, medias: 0, lacunas: 1, naoRelevantes: 0, aguardamJuizo: 1 });
    expect(relationalSummarySentence(summary)).toBe(
      "1 alta · 1 lacuna de informação · 1 aguarda juízo do Curador",
    );
  });

  it("o resumo não tem score, total, percentual nem posição — só contagens nomeadas", () => {
    const summary = relationalSummary([]);
    expect(Object.keys(summary).sort()).toEqual([
      "aguardamJuizo",
      "altas",
      "lacunas",
      "medias",
      "naoRelevantes",
    ]);
  });

  it("o motor não ordena: a saída segue a ordem do Catálogo, não a do resultado", () => {
    const { readings } = crossRelational(needs, evidence);
    // ALTA vem primeiro só porque MODELO_COMUNICACAO vem primeiro no Catálogo;
    // a lacuna de ALTERNATIVAS vem depois do juízo de DECISAO pela mesma razão.
    expect(readings.map((r) => r.code)).toEqual(
      RELATIONAL_CONCEPTS.filter((c) => needs.some((n) => n.subcriterionCode === c.code)).map((c) => c.code),
    );
  });
});
