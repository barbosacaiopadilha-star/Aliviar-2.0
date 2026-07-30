import { describe, expect, it } from "vitest";

import { applyAreaGate, ASSESSMENT_LABELS, ASSESSMENTS } from "@/modules/curadoria/cruzamento";
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

describe("Escala de avaliação — quatro estados, nunca uma régua contínua", () => {
  it("são exatamente quatro, e informação insuficiente é um estado próprio", () => {
    expect(ASSESSMENTS).toHaveLength(4);
    expect(ASSESSMENTS).toContain("INFORMACAO_INSUFICIENTE");
    expect(ASSESSMENT_LABELS.INFORMACAO_INSUFICIENTE).toBe("Informação insuficiente");
  });

  it("M5: o módulo não converte mais avaliação em número, peso ou cobertura", async () => {
    const modulo = await import("@/modules/curadoria/cruzamento");
    for (const removido of [
      "alignmentOf",
      "balanceOfBlock",
      "BLOCK_POINTS",
      "coverageSentence",
      "cruzar",
    ]) {
      expect(removido in modulo, removido).toBe(false);
    }
  });
});
