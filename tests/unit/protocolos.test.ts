import { describe, expect, it } from "vitest";

import {
  ACKNOWLEDGMENT_STATES,
  NEED_DEGREES,
  PERSON_PROTOCOL,
  PERSON_QUESTIONS_BY_CODE,
  PROFESSIONAL_PROTOCOL,
  PROTOCOL_PARTS,
  professionalQuestionsOfPart,
  protocolProgress,
} from "@/modules/curadoria/protocolos";
import { PRACTICE_CATALOG, PRACTICE_CONCEPTS_BY_CODE } from "@/modules/curadoria/evidencias-pratica";

/**
 * PROTOCOLOS OFICIAIS — guardas do contrato executável.
 *
 * O que se pina: 28 perguntas do profissional em bijeção com o Catálogo,
 * 14 perguntas da pessoa + 2 declarações clínicas, nenhuma pergunta órfã,
 * nenhum conceito novo, distribuição por eixo preservada, e as regras de
 * forma da Gramática (situação no lugar de opinião; texto guiado só em P14).
 */

describe("Protocolo do Profissional — Q1..Q28", () => {
  it("são exatamente 28 perguntas, uma por conceito do Catálogo, na ordem dele", () => {
    expect(PROFESSIONAL_PROTOCOL).toHaveLength(28);
    expect(PROFESSIONAL_PROTOCOL.map((q) => q.concept.code)).toEqual(
      PRACTICE_CATALOG.map((c) => c.code),
    );
    expect(PROFESSIONAL_PROTOCOL.map((q) => q.id)).toEqual(
      Array.from({ length: 28 }, (_, i) => `Q${i + 1}`),
    );
  });

  it("as cinco partes cobrem os cinco eixos, com a distribuição congelada", () => {
    expect(professionalQuestionsOfPart("A")).toHaveLength(4);
    expect(professionalQuestionsOfPart("B")).toHaveLength(5);
    expect(professionalQuestionsOfPart("C")).toHaveLength(5);
    expect(professionalQuestionsOfPart("D")).toHaveLength(12);
    expect(professionalQuestionsOfPart("E")).toHaveLength(2);
    expect(Object.keys(PROTOCOL_PARTS)).toHaveLength(5);
  });

  it("nenhuma pergunta é opinião ou autoavaliação — situação, sempre", () => {
    const autoavaliacao = /você é|você se considera|se comunica bem|é bom em|qualidade do seu/i;
    for (const q of PROFESSIONAL_PROTOCOL) {
      expect(q.question, q.id).not.toMatch(autoavaliacao);
    }
  });

  it("o contrato de opções vem do Catálogo — nunca de lista paralela", () => {
    for (const q of PROFESSIONAL_PROTOCOL) {
      expect(q.concept).toBe(PRACTICE_CONCEPTS_BY_CODE.get(q.concept.code));
    }
  });
});

describe("Protocolo da Pessoa — P1..P16", () => {
  it("são 16 entradas: 14 perguntas + 2 declarações clínicas", () => {
    expect(PERSON_PROTOCOL).toHaveLength(16);
    const clinicas = PERSON_PROTOCOL.filter((p) => p.mode === "DECLARACAO_CLINICA");
    expect(clinicas.map((p) => p.subcriterionCode).sort()).toEqual([
      "CONTINUIDADE_EQUIPE_DE_APOIO",
      "CONTINUIDADE_POS_PROCEDIMENTO",
    ]);
    expect(PERSON_PROTOCOL.filter((p) => p.mode !== "DECLARACAO_CLINICA")).toHaveLength(14);
  });

  it("nenhuma pergunta órfã: todo conceito referenciado existe no Catálogo", () => {
    for (const p of PERSON_PROTOCOL) {
      expect(PRACTICE_CONCEPTS_BY_CODE.has(p.subcriterionCode), p.id).toBe(true);
    }
  });

  it("os 12 conceitos técnicos não têm lado da pessoa — ausência por definição", () => {
    const tecnicos = PRACTICE_CATALOG.filter((c) => c.axis === "PRATICA_E_TRAJETORIA");
    expect(tecnicos).toHaveLength(12);
    for (const conceito of tecnicos) {
      expect(PERSON_QUESTIONS_BY_CODE.has(conceito.code), conceito.code).toBe(false);
    }
  });

  it("texto guiado só em P14 — o único autorizado pela Gramática", () => {
    const comTexto = PERSON_PROTOCOL.filter((p) => p.allowsGuidedText);
    expect(comTexto.map((p) => p.id)).toEqual(["P14"]);
    expect(comTexto[0]!.subcriterionCode).toBe("MODELO_PREFERENCIAS_E_RESTRICOES");
  });

  it("modos e vocabulários fechados: grau tem 4 valores, reconhecimento tem 4 estados", () => {
    // PESA_MUITO, e não IMPORTANTE: `IMPORTANTE` é nível de importância do
    // Case, e o mesmo literal nas duas escalas fazia a matriz do Motor aceitar
    // um grau da pessoa como importância. Ver importancia-vs-grau.test.ts.
    expect(NEED_DEGREES).toEqual(["ESSENCIAL", "PESA_MUITO", "DESEJAVEL", "SEM_PREFERENCIA"]);
    expect(ACKNOWLEDGMENT_STATES).toEqual(["PENDENTE", "RECONHECIDA", "CORRIGIDA", "RECUSADA"]);
    const diretas = PERSON_PROTOCOL.filter((p) => p.mode === "DIRETO").map((p) => p.id);
    expect(diretas).toEqual(["P1", "P3", "P11", "P13", "P15", "P16"]);
  });

  it("as perguntas falam a língua da vida — sem código de conceito no texto", () => {
    for (const p of PERSON_PROTOCOL) {
      expect(p.question, p.id).not.toMatch(/[A-Z]{3,}_[A-Z]/);
      expect(p.question, p.id).not.toMatch(/modalidade assistencial|subcritério/i);
    }
  });
});

describe("Progresso — contagem, nunca percentual", () => {
  it("conta respondidas de 28, ignorando código desconhecido", () => {
    expect(protocolProgress([])).toEqual({ answered: 0, total: 28 });
    expect(
      protocolProgress(["ACESSO_MODALIDADE", "CONTINUIDADE_CANAIS", "CONCEITO_FANTASMA", "ACESSO_MODALIDADE"]),
    ).toEqual({ answered: 2, total: 28 });
  });
});
