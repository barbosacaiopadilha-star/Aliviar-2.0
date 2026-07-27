import { describe, expect, it } from "vitest";

import {
  budgetOf,
  buildComparison,
  clampWeight,
  classifyProfessional,
  headerCounts,
  nextStepSentence,
  type MandatoryFilterCheck,
} from "@/modules/curadoria/mesa-cruzamento-view";
import type { CriterionEvaluation, CriterionWeight } from "@/modules/curadoria/cruzamento";

const FILTROS_OK: MandatoryFilterCheck[] = [
  { label: "Atendimento em SP", requirement: "SP", professionalValue: "SP", passes: true },
  { label: "Cuidado contínuo", requirement: "obrigatório", professionalValue: "oferece", passes: true },
];

describe("Orçamento de pontos — o Curador nunca soma", () => {
  it("começa em 0 de 50 e diz quanto resta", () => {
    const budget = budgetOf({}, "TECNICO");
    expect(budget.used).toBe(0);
    expect(budget.remaining).toBe(50);
    expect(budget.complete).toBe(false);
    expect(budget.sentence).toContain("Restam 50 pontos");
  });

  it("fecha em 50 com a frase de conclusão", () => {
    const budget = budgetOf({ FORMACAO: 15, EXPERIENCIA: 25, TRAJETORIA: 10 }, "TECNICO");
    expect(budget.complete).toBe(true);
    expect(budget.sentence).toBe("50 de 50 — distribuição concluída");
  });

  it("saldo parcial diz exatamente o que falta", () => {
    const budget = budgetOf({ FORMACAO: 15, EXPERIENCIA: 25 }, "TECNICO");
    expect(budget.sentence).toBe("40 de 50 distribuídos. Restam 10 pontos.");
  });

  it("critério do outro bloco não conta no saldo", () => {
    // ACESSO é do bloco pessoal; o técnico não o enxerga.
    const budget = budgetOf({ FORMACAO: 15, ACESSO: 20 }, "TECNICO");
    expect(budget.used).toBe(15);
  });

  it("o bloco pessoal tem o próprio saldo de 50", () => {
    const budget = budgetOf({ ACESSO: 15, FORMA_DE_CUIDADO: 25, COMPATIBILIDADE_PESSOAL: 10 }, "PRIORIDADES");
    expect(budget.complete).toBe(true);
  });

  it("clamp impede negativo e impede ultrapassar o saldo", () => {
    const weights = { FORMACAO: 15, EXPERIENCIA: 25 };
    expect(clampWeight(weights, "TRAJETORIA", -5)).toBe(0);
    // Restam 10; pedir 20 devolve 10.
    expect(clampWeight(weights, "TRAJETORIA", 20)).toBe(10);
    // Aumentar um critério existente respeita o que os outros já usam.
    expect(clampWeight(weights, "EXPERIENCIA", 40)).toBe(35);
  });
});

describe("Elegibilidade — a ordem das perguntas importa", () => {
  it("sem declaração, aguarda o Curador — antes de qualquer cruzamento", () => {
    const result = classifyProfessional("p1", null, FILTROS_OK);
    expect(result.state).toBe("AGUARDANDO_DECLARACAO");
  });

  it("compatível com filtros atendidos é elegível", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      FILTROS_OK,
    );
    expect(result.state).toBe("ELEGIVEL");
  });

  it("incompatível é eliminado — e não recebe avaliação ponderada", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "INCOMPATIVEL", confirmedByCurator: false, rationale: "Atua em joelho." },
      FILTROS_OK,
    );
    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("incompatível");
  });

  it("parcial sem confirmação não participa; com confirmação, participa", () => {
    const base = { compatibility: "PARCIALMENTE_COMPATIVEL" as const, rationale: "Região, não a lesão." };
    expect(classifyProfessional("p1", { ...base, confirmedByCurator: false }, FILTROS_OK).state).toBe("ELIMINADO");
    expect(classifyProfessional("p1", { ...base, confirmedByCurator: true }, FILTROS_OK).state).toBe("ELEGIVEL");
  });

  it("informação insuficiente fica pendente — nunca eliminado", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "INFORMACAO_INSUFICIENTE", confirmedByCurator: false, rationale: "Falta o detalhe da área." },
      FILTROS_OK,
    );
    expect(result.state).toBe("PENDENTE_DE_INFORMACAO");
  });

  it("filtro obrigatório não atendido elimina, com o filtro nomeado", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      [{ label: "Atendimento em SP", requirement: "SP", professionalValue: "RJ", passes: false }],
    );
    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("Atendimento em SP");
  });

  it("filtro sem informação deixa pendente — verificar, não descartar", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      [{ label: "Cuidado contínuo", requirement: "obrigatório", professionalValue: "informação não localizada", passes: null }],
    );
    expect(result.state).toBe("PENDENTE_DE_INFORMACAO");
    expect(result.reason).toContain("Verificar o cadastro, não descartar");
  });
});

describe("Cabeçalho — os números e a vez", () => {
  const eligibilities = [
    classifyProfessional("a", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS_OK),
    classifyProfessional("b", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS_OK),
    classifyProfessional("c", null, FILTROS_OK),
    classifyProfessional("d", { compatibility: "INCOMPATIVEL", confirmedByCurator: false, rationale: "Joelho." }, FILTROS_OK),
  ];

  it("conta cada estado sem misturar eliminado com pendente", () => {
    const counts = headerCounts(eligibilities, 0);
    expect(counts).toEqual({ found: 4, awaiting: 1, eligible: 2, eliminated: 1, pending: 0, selected: 0 });
  });

  it("a frase da vez segue a ordem do trabalho", () => {
    const counts = headerCounts(eligibilities, 0);
    expect(nextStepSentence(counts, false, false)).toContain("validado pela pessoa");
    expect(nextStepSentence(counts, false, true)).toContain("distribuir os pontos");
    expect(nextStepSentence(counts, true, true)).toContain("declarar a compatibilidade");
    const semPendencias = headerCounts(eligibilities.filter((e) => e.state !== "AGUARDANDO_DECLARACAO"), 0);
    expect(nextStepSentence(semPendencias, true, true)).toContain("selecionar três");
    expect(nextStepSentence({ ...semPendencias, selected: 3 }, true, true)).toContain("Relatório");
  });
});

describe("Comparação — explica, não elege", () => {
  const WEIGHTS: CriterionWeight[] = [
    { criterion: "FORMACAO", weight: 15 },
    { criterion: "EXPERIENCIA", weight: 25 },
    { criterion: "TRAJETORIA", weight: 10 },
    { criterion: "ACESSO", weight: 15 },
    { criterion: "FORMA_DE_CUIDADO", weight: 25 },
    { criterion: "COMPATIBILIDADE_PESSOAL", weight: 10 },
  ];

  function evals(assessments: Partial<Record<string, CriterionEvaluation["assessment"]>>): CriterionEvaluation[] {
    return Object.entries(assessments).map(([criterion, assessment]) => ({
      criterion: criterion as CriterionEvaluation["criterion"],
      assessment: assessment!,
      evidence: `Avaliação registrada para ${criterion}.`,
    }));
  }

  const COMPLETO = evals({
    FORMACAO: "ATENDE_PLENAMENTE",
    EXPERIENCIA: "ATENDE_PLENAMENTE",
    TRAJETORIA: "ATENDE_PARCIALMENTE",
    ACESSO: "ATENDE_PLENAMENTE",
    FORMA_DE_CUIDADO: "ATENDE_PLENAMENTE",
    COMPATIBILIDADE_PESSOAL: "ATENDE_PLENAMENTE",
  });

  const SEM_COMPAT = evals({
    FORMACAO: "ATENDE_PLENAMENTE",
    EXPERIENCIA: "ATENDE_PLENAMENTE",
    TRAJETORIA: "ATENDE_PLENAMENTE",
    ACESSO: "ATENDE_PARCIALMENTE",
    FORMA_DE_CUIDADO: "ATENDE_PLENAMENTE",
    COMPATIBILIDADE_PESSOAL: "INFORMACAO_INSUFICIENTE",
  });

  it("cada célula traz estado, pontos aproveitados sobre o peso, e a frase", () => {
    const [column] = buildComparison(["a"], WEIGHTS, new Map([["a", COMPLETO]]));
    const experiencia = column!.cells.find((cell) => cell.criterion === "EXPERIENCIA")!;
    expect(experiencia.pointsSentence).toBe("25/25");
    const trajetoria = column!.cells.find((cell) => cell.criterion === "TRAJETORIA")!;
    expect(trajetoria.pointsSentence).toBe("5/10");
    expect(trajetoria.evidence).toContain("TRAJETORIA");
  });

  it("informação insuficiente aparece como não avaliável, nunca como zero", () => {
    const [column] = buildComparison(["b"], WEIGHTS, new Map([["b", SEM_COMPAT]]));
    const compat = column!.cells.find((cell) => cell.criterion === "COMPATIBILIDADE_PESSOAL")!;
    expect(compat.pointsSentence).toBe("não avaliável");
    expect(compat.pointsSentence).not.toContain("0/");
  });

  it("a cobertura de quem tem lacuna cai para 90 e vira frase", () => {
    const [column] = buildComparison(["b"], WEIGHTS, new Map([["b", SEM_COMPAT]]));
    expect(column!.result.coverage).toBe(90);
    expect(column!.coverageSentence).toBe("Avaliação construída sobre 90 dos 100 pontos possíveis.");
  });

  it("ordena a leitura sem posições, medalhas ou vocabulário de pódio", () => {
    const columns = buildComparison(
      ["a", "b"],
      WEIGHTS,
      new Map([
        ["a", COMPLETO],
        ["b", SEM_COMPAT],
      ]),
    );

    expect(columns).toHaveLength(2);
    const texto = JSON.stringify(columns).toLowerCase();
    for (const proibido of ["melhor", "vencedor", "recomendado", "ranking", "colocado", "posição"]) {
      expect(texto, `vocabulário de pódio: ${proibido}`).not.toContain(proibido);
    }
    // Nenhuma coluna carrega número de posição.
    expect(Object.keys(columns[0]!)).not.toContain("position");
  });

  it("quem não foi avaliado em nada aparece com cobertura zero, não com nota zero", () => {
    const [column] = buildComparison(["c"], WEIGHTS, new Map());
    expect(column!.result.coverage).toBe(0);
    expect(column!.cells.every((cell) => cell.pointsSentence === "não avaliável")).toBe(true);
  });
});
