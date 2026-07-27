import { describe, expect, it } from "vitest";

import {
  alignmentOf,
  applyAreaGate,
  balanceOfBlock,
  BLOCK_POINTS,
  coverageSentence,
  cruzar,
  type CriterionEvaluation,
  type CriterionWeight,
} from "@/modules/curadoria/cruzamento";

const TECNICO: CriterionWeight[] = [
  { criterion: "FORMACAO", weight: 30 },
  { criterion: "EXPERIENCIA", weight: 50 },
  { criterion: "HISTORICO", weight: 20 },
];

const PRIORIDADES: CriterionWeight[] = [
  { criterion: "ACESSO", weight: 30 },
  { criterion: "CONTINUIDADE_DO_CUIDADO", weight: 50 },
  { criterion: "MODELO_DE_ATENDIMENTO", weight: 20 },
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
  evaluation("HISTORICO", "ATENDE_PLENAMENTE"),
  evaluation("ACESSO", "ATENDE_PLENAMENTE"),
  evaluation("CONTINUIDADE_DO_CUIDADO", "ATENDE_PLENAMENTE"),
  evaluation("MODELO_DE_ATENDIMENTO", "ATENDE_PLENAMENTE"),
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

describe("Distribuição de pontos — cada cruzamento fecha em 100", () => {
  it("aceita um cruzamento que soma exatamente 100", () => {
    const balance = balanceOfBlock(TECNICO, "TECNICO");
    expect(balance.valid).toBe(true);
    expect(balance.total).toBe(BLOCK_POINTS);
    expect(balance.remaining).toBe(0);
  });

  it("recusa soma diferente de 100 e devolve o saldo que falta", () => {
    const balance = balanceOfBlock(
      [
        { criterion: "FORMACAO", weight: 30 },
        { criterion: "EXPERIENCIA", weight: 30 },
        { criterion: "HISTORICO", weight: 10 },
      ],
      "TECNICO",
    );
    expect(balance.valid).toBe(false);
    expect(balance.total).toBe(70);
    expect(balance.remaining).toBe(30);
  });

  it("recusa critério do outro cruzamento", () => {
    const balance = balanceOfBlock(
      [
        { criterion: "FORMACAO", weight: 50 },
        { criterion: "EXPERIENCIA", weight: 50 },
        { criterion: "ACESSO", weight: 0 },
      ],
      "TECNICO",
    );
    expect(balance.valid).toBe(false);
    expect(balance.errors.join(" ")).toContain("não pertence a este bloco");
  });

  it("cobra que todos os três critérios do cruzamento sejam distribuídos", () => {
    const balance = balanceOfBlock([{ criterion: "FORMACAO", weight: 100 }], "TECNICO");
    expect(balance.valid).toBe(false);
    expect(balance.errors.join(" ")).toContain("Falta distribuir");
  });

  it("os dois cruzamentos são orçamentos separados — não existe um bolo de 200", () => {
    // Cada um fecha em 100 por conta própria; nenhuma soma cruzada é válida
    // nem necessária.
    expect(balanceOfBlock(TECNICO, "TECNICO").valid).toBe(true);
    expect(balanceOfBlock(PRIORIDADES, "PRIORIDADES").valid).toBe(true);
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

describe("Cruzamento — dois resultados independentes", () => {
  it("tudo pleno entrega 100 e 100, lado a lado", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: TODAS_PLENAS,
    });

    expect(result.technical.score).toBe(100);
    expect(result.patient.score).toBe(100);
    expect(result.technical.coveredWeight).toBe(100);
    expect(result.patient.coveredWeight).toBe(100);
  });

  it("o resultado não carrega total combinado — os 200 pontos não existem", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: TODAS_PLENAS,
    });

    // A proibição do Modelo v1.0 §7, pinada: se alguém reintroduzir um campo
    // somado, este teste quebra.
    expect(result).not.toHaveProperty("total");
    expect(result).not.toHaveProperty("coverage");
  });

  it("os cruzamentos são independentes: técnico impecável não compensa acesso inviável", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [
        evaluation("FORMACAO", "ATENDE_PLENAMENTE"),
        evaluation("EXPERIENCIA", "ATENDE_PLENAMENTE"),
        evaluation("HISTORICO", "ATENDE_PLENAMENTE"),
        evaluation("ACESSO", "NAO_ATENDE"),
        evaluation("CONTINUIDADE_DO_CUIDADO", "NAO_ATENDE"),
        evaluation("MODELO_DE_ATENDIMENTO", "NAO_ATENDE"),
      ],
    });

    // As duas perguntas são respondidas lado a lado, nunca uma pela outra: a
    // Avaliação Técnica fica em 100 E a Compatibilidade Assistencial em 0 —
    // e nenhum número tenta conciliá-las.
    expect(result.technical.score).toBe(100);
    expect(result.patient.score).toBe(0);
  });

  it("informação insuficiente sai do cálculo e reaparece como cobertura do próprio cruzamento", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [
        evaluation("FORMACAO", "ATENDE_PLENAMENTE"),
        evaluation("EXPERIENCIA", "ATENDE_PLENAMENTE"),
        evaluation("HISTORICO", "INFORMACAO_INSUFICIENTE"),
        ...TODAS_PLENAS.filter((e) => !["FORMACAO", "EXPERIENCIA", "HISTORICO"].includes(e.criterion)),
      ],
    });

    // Histórico valia 20 e não pôde ser avaliado: a Avaliação Técnica segue
    // valendo 100 sobre o que foi possível olhar, e a cobertura DELA cai para
    // 80. O cruzamento assistencial não é afetado.
    expect(result.technical.score).toBe(100);
    expect(result.technical.coveredWeight).toBe(80);
    expect(result.technical.criteriaWithoutData).toBe(1);
    expect(result.patient.coveredWeight).toBe(100);
    expect(coverageSentence(result.technical)).toBe("Avaliação construída sobre 80 dos 100 pontos possíveis.");
  });

  it("critério não avaliado é tratado como informação insuficiente, nunca como zero", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      // HISTORICO sequer foi avaliado.
      evaluations: TODAS_PLENAS.filter((e) => e.criterion !== "HISTORICO"),
    });

    const historico = result.technical.criteria.find((c) => c.criterion === "HISTORICO")!;
    expect(historico.assessment).toBe("INFORMACAO_INSUFICIENTE");
    expect(historico.alignment).toBeNull();
    expect(historico.evidence).toContain("nada foi presumido");
  });

  it("cadastro vazio não vira nota zero — vira cobertura zero nos dois cruzamentos", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: [],
    });

    expect(result.technical.score).toBe(0);
    expect(result.patient.score).toBe(0);
    // O que distingue este caso de "não atende nada" é a cobertura: aqui não
    // se sabe, ali se sabe que não.
    expect(result.technical.coveredWeight).toBe(0);
    expect(result.patient.coveredWeight).toBe(0);
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
    expect(result.narrative[0]).toContain("50 pts");
    expect(result.narrative.at(-1)).toContain("20 pts");
    expect(result.narrative[0]).toContain("Atende plenamente");
  });

  it("as frases falam o vocabulário oficial: Histórico, Continuidade do Cuidado, Modelo de Atendimento", () => {
    const result = cruzar({
      professionalProfileId: "p1",
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: TODAS_PLENAS,
    });

    const texto = result.narrative.join(" ");
    expect(texto).toContain("Histórico Profissional");
    expect(texto).toContain("Continuidade do Cuidado");
    expect(texto).toContain("Modelo de Atendimento");
    // A língua antiga não volta.
    expect(texto).not.toContain("Trajetória");
    expect(texto).not.toContain("Forma de Cuidado");
    expect(texto).not.toContain("Compatibilidade Pessoal");
  });
});
