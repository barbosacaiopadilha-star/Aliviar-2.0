import { describe, expect, it } from "vitest";

import {
  alignmentOf,
  applyAreaGate,
  balanceOfBlock,
  BLOCK_POINTS,
  coverageSentence,
  cruzar,
  organizeForCurator,
  TOTAL_POINTS,
  type CriterionEvaluation,
  type CriterionWeight,
} from "@/modules/curadoria/cruzamento";

const TECNICO: CriterionWeight[] = [
  { criterion: "FORMACAO", weight: 20 },
  { criterion: "EXPERIENCIA", weight: 20 },
  { criterion: "TRAJETORIA", weight: 10 },
];

const PRIORIDADES: CriterionWeight[] = [
  { criterion: "ACESSO", weight: 20 },
  { criterion: "FORMA_DE_CUIDADO", weight: 15 },
  { criterion: "COMPATIBILIDADE_PESSOAL", weight: 15 },
];

function evaluation(
  criterion: CriterionEvaluation["criterion"],
  assessment: CriterionEvaluation["assessment"],
): CriterionEvaluation {
  return { criterion, assessment, evidence: "Evidência registrada pelo Curador." };
}

const TODAS_PLENAS: CriterionEvaluation[] = [
  evaluation("FORMACAO", "ATENDE_PLENAMENTE"),
  evaluation("EXPERIENCIA", "ATENDE_PLENAMENTE"),
  evaluation("TRAJETORIA", "ATENDE_PLENAMENTE"),
  evaluation("ACESSO", "ATENDE_PLENAMENTE"),
  evaluation("FORMA_DE_CUIDADO", "ATENDE_PLENAMENTE"),
  evaluation("COMPATIBILIDADE_PESSOAL", "ATENDE_PLENAMENTE"),
];

describe("Área de atuação — porta de entrada, não pontuação", () => {
  it("compatível participa", () => {
    const outcome = applyAreaGate({
      professionalProfileId: "p1",
      compatibility: "COMPATIVEL",
      rationale: null,
      confirmedByCurator: false,
    });
    expect(outcome.participates).toBe(true);
  });

  it("incompatível não participa — e o motivo diz que é a área, não a nota", () => {
    const outcome = applyAreaGate({
      professionalProfileId: "p1",
      compatibility: "INCOMPATIVEL",
      rationale: "Atua em outra especialidade.",
      confirmedByCurator: false,
    });
    expect(outcome.participates).toBe(false);
    expect(outcome.reason).toContain("incompatível");
    expect(outcome.pendingVerification).toBe(false);
  });

  it("parcialmente compatível só entra com confirmação do Curador", () => {
    const base = {
      professionalProfileId: "p1",
      compatibility: "PARCIALMENTE_COMPATIVEL" as const,
      rationale: "Trabalha com a região, não com a lesão específica.",
    };

    expect(applyAreaGate({ ...base, confirmedByCurator: false }).participates).toBe(false);
    expect(applyAreaGate({ ...base, confirmedByCurator: true }).participates).toBe(true);
  });

  it("informação insuficiente fica pendente de verificação — nunca descartado como inadequado", () => {
    const outcome = applyAreaGate({
      professionalProfileId: "p1",
      compatibility: "INFORMACAO_INSUFICIENTE",
      rationale: null,
      confirmedByCurator: false,
    });
    // A distinção importa: a ação corretiva é verificar o cadastro, não
    // concluir que o profissional não serve.
    expect(outcome.participates).toBe(false);
    expect(outcome.pendingVerification).toBe(true);
  });
});

describe("Distribuição de pontos — cada bloco fecha em 50", () => {
  it("aceita um bloco que soma exatamente 50", () => {
    const balance = balanceOfBlock(TECNICO, "TECNICO");
    expect(balance.valid).toBe(true);
    expect(balance.total).toBe(BLOCK_POINTS);
    expect(balance.remaining).toBe(0);
  });

  it("recusa soma diferente de 50 e devolve o saldo que falta", () => {
    const balance = balanceOfBlock(
      [
        { criterion: "FORMACAO", weight: 20 },
        { criterion: "EXPERIENCIA", weight: 10 },
        { criterion: "TRAJETORIA", weight: 5 },
      ],
      "TECNICO",
    );
    expect(balance.valid).toBe(false);
    expect(balance.total).toBe(35);
    expect(balance.remaining).toBe(15);
  });

  it("recusa critério do outro bloco", () => {
    const balance = balanceOfBlock(
      [
        { criterion: "FORMACAO", weight: 25 },
        { criterion: "EXPERIENCIA", weight: 25 },
        { criterion: "ACESSO", weight: 0 },
      ],
      "TECNICO",
    );
    expect(balance.valid).toBe(false);
    expect(balance.errors.join(" ")).toContain("não pertence a este bloco");
  });

  it("cobra que todos os três critérios do bloco sejam distribuídos", () => {
    const balance = balanceOfBlock([{ criterion: "FORMACAO", weight: 50 }], "TECNICO");
    expect(balance.valid).toBe(false);
    expect(balance.errors.join(" ")).toContain("Falta distribuir");
  });

  it("os dois blocos somados fecham os 100 pontos", () => {
    expect(balanceOfBlock(TECNICO, "TECNICO").total + balanceOfBlock(PRIORIDADES, "PRIORIDADES").total).toBe(
      TOTAL_POINTS,
    );
  });
});

describe("Escala de avaliação — quatro estados", () => {
  it("informação insuficiente não é zero nem cem", () => {
    expect(alignmentOf("INFORMACAO_INSUFICIENTE")).toBeNull();
    expect(alignmentOf("NAO_ATENDE")).toBe(0);
    expect(alignmentOf("ATENDE_PLENAMENTE")).toBe(100);
    expect(alignmentOf("ATENDE_PARCIALMENTE")).toBe(50);
  });
});

describe("Cruzamento — dois perfis de peso igual", () => {
  it("tudo pleno entrega 50 + 50 com cobertura total", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: TODAS_PLENAS,
    });

    expect(result.technical.score).toBe(50);
    expect(result.patient.score).toBe(50);
    expect(result.total).toBe(100);
    expect(result.coverage).toBe(TOTAL_POINTS);
  });

  it("os blocos são independentes: técnico impecável não compensa acesso inviável", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [
        evaluation("FORMACAO", "ATENDE_PLENAMENTE"),
        evaluation("EXPERIENCIA", "ATENDE_PLENAMENTE"),
        evaluation("TRAJETORIA", "ATENDE_PLENAMENTE"),
        evaluation("ACESSO", "NAO_ATENDE"),
        evaluation("FORMA_DE_CUIDADO", "NAO_ATENDE"),
        evaluation("COMPATIBILIDADE_PESSOAL", "NAO_ATENDE"),
      ],
    });

    // O teto de um perfil tecnicamente perfeito que não serve à vida da
    // pessoa é 50 de 100 — nunca mais. É a consequência de os blocos terem
    // peso igual.
    expect(result.technical.score).toBe(50);
    expect(result.patient.score).toBe(0);
    expect(result.total).toBe(50);
  });

  it("informação insuficiente sai do cálculo e reaparece como cobertura", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [
        evaluation("FORMACAO", "ATENDE_PLENAMENTE"),
        evaluation("EXPERIENCIA", "ATENDE_PLENAMENTE"),
        evaluation("TRAJETORIA", "INFORMACAO_INSUFICIENTE"),
        ...TODAS_PLENAS.filter((e) => !["FORMACAO", "EXPERIENCIA", "TRAJETORIA"].includes(e.criterion)),
      ],
    });

    // Trajetória valia 10 e não pôde ser avaliada: o bloco continua valendo
    // 50 sobre o que foi possível olhar, e a cobertura cai para 90.
    expect(result.technical.score).toBe(50);
    expect(result.technical.coveredWeight).toBe(40);
    expect(result.technical.criteriaWithoutData).toBe(1);
    expect(result.coverage).toBe(90);
    expect(coverageSentence(result)).toBe("Avaliação construída sobre 90 dos 100 pontos possíveis.");
  });

  it("critério não avaliado é tratado como informação insuficiente, nunca como zero", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      // TRAJETORIA sequer foi avaliada.
      evaluations: TODAS_PLENAS.filter((e) => e.criterion !== "TRAJETORIA"),
    });

    const trajetoria = result.technical.criteria.find((c) => c.criterion === "TRAJETORIA")!;
    expect(trajetoria.assessment).toBe("INFORMACAO_INSUFICIENTE");
    expect(trajetoria.alignment).toBeNull();
    expect(trajetoria.evidence).toContain("nada foi presumido");
  });

  it("cadastro vazio não vira nota zero — vira cobertura zero", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [],
    });

    expect(result.coverage).toBe(0);
    expect(result.total).toBe(0);
    // O que distingue este caso de "não atende nada" é a cobertura: aqui não
    // se sabe, ali se sabe que não.
    expect(result.technical.criteriaWithoutData).toBe(3);
    expect(result.patient.criteriaWithoutData).toBe(3);
  });

  it("o resultado se explica em frases, do peso maior para o menor", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: TODAS_PLENAS,
    });

    expect(result.narrative).toHaveLength(6);
    expect(result.narrative[0]).toContain("20 pts");
    expect(result.narrative.at(-1)).toContain("10 pts");
    expect(result.narrative[0]).toContain("Atende plenamente");
  });
});

describe("Organização para leitura", () => {
  it("ordena por total sem cortar nem selecionar", () => {
    const organized = organizeForCurator([{ total: 70 }, { total: 91 }, { total: 84 }]);
    expect(organized.map((r) => r.total)).toEqual([91, 84, 70]);
    expect(organized).toHaveLength(3);
  });

  it("empate mantém a ordem de entrada — desempate arbitrário pareceria decisão", () => {
    const a = { total: 80, id: "a" };
    const b = { total: 80, id: "b" };
    expect(organizeForCurator([a, b]).map((r) => r.id)).toEqual(["a", "b"]);
  });
});
