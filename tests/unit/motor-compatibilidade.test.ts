import { describe, expect, it } from "vitest";

import { IMPORTANCE_LEVELS, SUBCRITERION_CATALOG, type ImportanceLevel } from "@/modules/curadoria/mapa-prioridades";
import { SUBCRITERION_STATUSES, type SubcriterionStatus } from "@/modules/curadoria/mapa-profissional";
import {
  assertSameCatalog,
  COMPATIBILITY_LABELS,
  COMPATIBILITY_RESULTS,
  crossOne,
  crossPriorityAndProfessional,
  summarySentence,
  type CompatibilityResult,
} from "@/modules/curadoria/motor-compatibilidade";

const ATIVOS = SUBCRITERION_CATALOG.map((entry) => entry.code);

/** As nove combinações escritas na definição do Modelo, palavra por palavra. */
const DEFINIDAS: [ImportanceLevel, SubcriterionStatus, CompatibilityResult][] = [
  ["MUITO_IMPORTANTE", "CONFIRMADO", "ALTA_COMPATIBILIDADE"],
  ["IMPORTANTE", "CONFIRMADO", "ALTA_COMPATIBILIDADE"],
  ["RELEVANTE", "CONFIRMADO", "MEDIA_COMPATIBILIDADE"],
  ["POUCO_IMPORTANTE", "CONFIRMADO", "MEDIA_COMPATIBILIDADE"],
  ["NAO_INFLUENCIA", "CONFIRMADO", "NAO_RELEVANTE"],
  ["MUITO_IMPORTANTE", "NAO_INFORMADO", "LACUNA_DE_INFORMACAO"],
  ["IMPORTANTE", "NAO_INFORMADO", "LACUNA_DE_INFORMACAO"],
  ["RELEVANTE", "NAO_INFORMADO", "LACUNA_DE_INFORMACAO"],
  ["MUITO_IMPORTANTE", "NAO_CONFIRMADO", "MEDIA_COMPATIBILIDADE"],
];

describe("A matriz — as nove combinações definidas", () => {
  it.each(DEFINIDAS)("%s × %s → %s", (importancia, estado, esperado) => {
    expect(crossOne(importancia, estado)).toBe(esperado);
  });
});

describe("A matriz — as quinze combinações", () => {
  it("toda combinação devolve exatamente um dos quatro resultados", () => {
    for (const importancia of IMPORTANCE_LEVELS) {
      for (const estado of SUBCRITERION_STATUSES) {
        const resultado = crossOne(importancia, estado);
        expect(COMPATIBILITY_RESULTS, `${importancia} × ${estado}`).toContain(resultado);
      }
    }
    expect(IMPORTANCE_LEVELS.length * SUBCRITERION_STATUSES.length).toBe(15);
  });

  it("é determinística — mil chamadas, mesma resposta", () => {
    for (let i = 0; i < 1000; i += 1) {
      expect(crossOne("RELEVANTE", "NAO_CONFIRMADO")).toBe("MEDIA_COMPATIBILIDADE");
    }
  });

  // --- os três princípios que preencheram as seis combinações derivadas ---

  it("princípio 1: 'não influencia' encerra o assunto nos três estados", () => {
    for (const estado of SUBCRITERION_STATUSES) {
      expect(crossOne("NAO_INFLUENCIA", estado), estado).toBe("NAO_RELEVANTE");
    }
  });

  it("princípio 2: ausência nunca elimina e nunca vira alta", () => {
    for (const importancia of IMPORTANCE_LEVELS) {
      const resultado = crossOne(importancia, "NAO_CONFIRMADO");
      expect(resultado, `${importancia} não pode ser alta`).not.toBe("ALTA_COMPATIBILIDADE");
      expect(
        resultado === "MEDIA_COMPATIBILIDADE" || resultado === "NAO_RELEVANTE",
        `${importancia} → ${resultado}`,
      ).toBe(true);
    }
  });

  it("princípio 3: lacuna aparece como lacuna em toda importância que conta", () => {
    for (const importancia of IMPORTANCE_LEVELS) {
      if (importancia === "NAO_INFLUENCIA") continue;
      expect(crossOne(importancia, "NAO_INFORMADO"), importancia).toBe("LACUNA_DE_INFORMACAO");
    }
  });

  it("nenhum resultado é score, nota, porcentagem ou colocação", () => {
    const texto = [...COMPATIBILITY_RESULTS, ...Object.values(COMPATIBILITY_LABELS)].join(" ").toLowerCase();
    for (const proibido of ["%", "score", "nota", "pontos", "ranking", "melhor", "1º", "posição"]) {
      expect(texto).not.toContain(proibido);
    }
  });
});

describe("Cruzamento de um profissional", () => {
  const prioridades = [
    { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" as const },
    { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", importance: "RELEVANTE" as const },
    { subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO", importance: "IMPORTANTE" as const },
    { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" as const },
  ];

  it("produz uma linha por subcritério declarado pelo Case", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [
        { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
        { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", status: "CONFIRMADO" },
        { subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO", status: "NAO_INFORMADO" },
        { subcriterionCode: "MODELO_COMUNICACAO", status: "CONFIRMADO" },
      ],
      activeSubcriterionCodes: ATIVOS,
    });

    expect(leitura.rows).toHaveLength(4);
    // Na ordem canônica do catálogo (a do banco, Bloco E): continuidade →
    // modelo → prática (formação, depois experiência).
    expect(leitura.rows.map((r) => [r.subcriterionCode, r.result])).toEqual([
      ["CONTINUIDADE_POS_PROCEDIMENTO", "LACUNA_DE_INFORMACAO"],
      ["MODELO_COMUNICACAO", "ALTA_COMPATIBILIDADE"],
      ["FORMACAO_RESIDENCIA", "ALTA_COMPATIBILIDADE"],
      ["EXPERIENCIA_NO_TIPO_DE_CASO", "MEDIA_COMPATIBILIDADE"],
    ]);
    expect(leitura.summary).toMatchObject({
      totalSubcriteria: 4,
      highCompatibility: 2,
      mediumCompatibility: 1,
      informationGaps: 1,
      notRelevant: 0,
    });
  });

  it("a ordem é a do catálogo, não a de gravação", () => {
    const embaralhado = [...prioridades].reverse();
    const a = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [],
      activeSubcriterionCodes: ATIVOS,
    });
    const b = crossPriorityAndProfessional({
      casePriorities: embaralhado,
      professionalStates: [],
      activeSubcriterionCodes: ATIVOS,
    });
    expect(a.rows.map((r) => r.subcriterionCode)).toEqual(b.rows.map((r) => r.subcriterionCode));
  });

  it("profissional sem mapa: tudo vira lacuna, e nenhum profissional é eliminado", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [],
      activeSubcriterionCodes: ATIVOS,
    });

    expect(leitura.rows.every((r) => r.result === "LACUNA_DE_INFORMACAO")).toBe(true);
    expect(leitura.summary.informationGaps).toBe(4);
    expect(leitura.summary.gapsWithoutAnyRecord, "ninguém tratou nenhum deles").toBe(4);
  });

  it("ausência de registro e NAO_INFORMADO caem no mesmo resultado, mas seguem distinguíveis", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [{ subcriterionCode: "FORMACAO_RESIDENCIA", status: "NAO_INFORMADO" }],
      activeSubcriterionCodes: ATIVOS,
    });

    const analisado = leitura.rows.find((r) => r.subcriterionCode === "FORMACAO_RESIDENCIA")!;
    const semRegistro = leitura.rows.find((r) => r.subcriterionCode === "MODELO_COMUNICACAO")!;

    expect(analisado.result).toBe("LACUNA_DE_INFORMACAO");
    expect(semRegistro.result).toBe("LACUNA_DE_INFORMACAO");

    expect(analisado.status, "alguém olhou e não soube").toBe("NAO_INFORMADO");
    expect(semRegistro.status, "ninguém olhou ainda").toBeNull();

    expect(leitura.summary.informationGaps).toBe(4);
    expect(leitura.summary.gapsWithoutAnyRecord).toBe(3);
  });

  it("Case sem mapa: não há o que cruzar, e isso é dito", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: [],
      professionalStates: [{ subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" }],
      activeSubcriterionCodes: ATIVOS,
    });

    expect(leitura.rows).toHaveLength(0);
    expect(leitura.summary.totalSubcriteria).toBe(0);
    expect(leitura.summary.notDeclaredByCase).toBe(ATIVOS.length);
    expect(summarySentence(leitura.summary)).toContain("ainda não foi preenchido");
  });

  it("mapa parcial do Case: o que ele não declarou fica fora do cruzamento e é contado à parte", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: prioridades,
      professionalStates: [],
      activeSubcriterionCodes: ATIVOS,
    });
    expect(leitura.summary.totalSubcriteria).toBe(4);
    expect(leitura.summary.notDeclaredByCase).toBe(ATIVOS.length - 4);
  });

  it("mapas completos dos dois lados: nenhuma linha fica sem resultado", () => {
    const completo = SUBCRITERION_CATALOG.map((entry) => ({
      subcriterionCode: entry.code,
      importance: "IMPORTANTE" as const,
    }));
    const leitura = crossPriorityAndProfessional({
      casePriorities: completo,
      professionalStates: SUBCRITERION_CATALOG.map((entry) => ({
        subcriterionCode: entry.code,
        status: "CONFIRMADO" as const,
      })),
      activeSubcriterionCodes: ATIVOS,
    });

    expect(leitura.rows).toHaveLength(ATIVOS.length);
    expect(leitura.summary.highCompatibility).toBe(ATIVOS.length);
    expect(leitura.summary.notDeclaredByCase).toBe(0);
    expect(leitura.rows.every((r) => COMPATIBILITY_RESULTS.includes(r.result))).toBe(true);
  });

  it("é idempotente — duas execuções, resultado idêntico", () => {
    const entrada = {
      casePriorities: prioridades,
      professionalStates: [{ subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" as const }],
      activeSubcriterionCodes: ATIVOS,
    };
    expect(crossPriorityAndProfessional(entrada)).toEqual(crossPriorityAndProfessional(entrada));
  });

  it("o resumo conta e não pontua", () => {
    const frase = summarySentence(
      crossPriorityAndProfessional({
        casePriorities: prioridades,
        professionalStates: [],
        activeSubcriterionCodes: ATIVOS,
      }).summary,
    );
    expect(frase).toContain("4 subcritérios cruzados");
    expect(frase).not.toMatch(/%|\bnota\b|score|melhor/i);
  });
});

describe("Catálogos divergentes", () => {
  it("recusa comparar quando um dos lados referencia subcritério fora do catálogo", () => {
    expect(() => assertSameCatalog(["INEXISTENTE"], ATIVOS, "Mapa do Profissional")).toThrow(
      /fora do catálogo ativo: INEXISTENTE/,
    );
    expect(() => assertSameCatalog(["INEXISTENTE"], ATIVOS, "Mapa do Profissional")).toThrow(
      /mesmo catálogo/,
    );
  });

  it("aceita quando os dois lados falam do mesmo catálogo", () => {
    expect(() => assertSameCatalog(ATIVOS, ATIVOS, "Mapa do Case")).not.toThrow();
  });

  it("subcritério inexistente no Case não produz linha fantasma", () => {
    const leitura = crossPriorityAndProfessional({
      casePriorities: [{ subcriterionCode: "NAO_EXISTE", importance: "MUITO_IMPORTANTE" }],
      professionalStates: [],
      activeSubcriterionCodes: ATIVOS,
    });
    expect(leitura.rows, "só entra o que está no catálogo ativo").toHaveLength(0);
  });
});
