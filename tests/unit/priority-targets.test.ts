import { describe, expect, it } from "vitest";

import { computeCompatibility } from "@/modules/curadoria/method";
import {
  PRIORITY_TARGET_OPTIONS,
  PRIORITY_TARGET_QUESTIONS,
  UF_OPTIONS,
  requiresTarget,
  targetLabel,
} from "@/modules/curadoria/priority-targets";
import { computePriorityValidationReadiness } from "@/modules/curadoria/priority-validation-readiness";
import { CRITERIA_REQUIRING_TARGET, PRIORITY_CRITERIA } from "@/modules/curadoria/types";

/**
 * O ALVO DECLARADO — o campo que faltava.
 *
 * Achado do teste em produção: o Motor exigia alvo em três critérios (I-04) e
 * a tela não tinha campo para ele. Quem escolhesse Área de atuação, Forma do
 * primeiro encontro ou Localização ficava impedido de validar o Perfil, sem
 * caminho de saída e sem mensagem que explicasse por quê.
 */

const PROVIDER = {
  professionalProfileId: "p1",
  displayName: "Dra. Teste",
  status: "ativo",
  experienceLevel: "experiente" as const,
  intakeApproach: "avaliacao_inicial" as const,
  offersContinuousCare: true,
  availabilityWindow: "flexible" as const,
  crmUf: "SP",
  competencyDomains: ["saude_fisica" as const],
};

describe("todo critério que exige alvo tem opções e pergunta", () => {
  it.each([...CRITERIA_REQUIRING_TARGET])("%s oferece opções fechadas", (criterion) => {
    const opcoes = PRIORITY_TARGET_OPTIONS[criterion];
    expect(opcoes, `${criterion} exige alvo e não tem opções — a tela ficaria sem campo`).toBeDefined();
    expect(opcoes!.length).toBeGreaterThan(0);
    expect(PRIORITY_TARGET_QUESTIONS[criterion]).toBeTruthy();
  });

  it("critério que NÃO exige alvo não ganha campo", () => {
    for (const criterion of PRIORITY_CRITERIA) {
      if (CRITERIA_REQUIRING_TARGET.includes(criterion)) continue;
      expect(requiresTarget(criterion)).toBe(false);
      expect(PRIORITY_TARGET_OPTIONS[criterion]).toBeUndefined();
    }
  });

  it("as 27 UFs, no formato que o Motor compara", () => {
    expect(UF_OPTIONS).toHaveLength(27);
    for (const uf of UF_OPTIONS) {
      // A comparação é `provider.crmUf === target`, e a coluna aceita ^[A-Z]{2}$.
      expect(uf.value).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("os valores oferecidos são os que o Motor de fato compara", () => {
  it("o alvo de área casa com o domínio do profissional", () => {
    const alvo = PRIORITY_TARGET_OPTIONS.AREA_DE_ATUACAO!.find((o) => o.value === "saude_fisica");
    expect(alvo, "a opção precisa existir com o valor exato do domínio").toBeDefined();

    const resultado = computeCompatibility(
      [{ criterion: "AREA_DE_ATUACAO", weight: 100, targetValue: alvo!.value, evidence: "e" }],
      PROVIDER,
    );
    expect(resultado.criteria[0]!.alignment).toBe(100);
  });

  it("o alvo de primeiro encontro casa com a abordagem do profissional", () => {
    const alvo = PRIORITY_TARGET_OPTIONS.ABORDAGEM_INICIAL!.find(
      (o) => o.value === "avaliacao_inicial",
    );
    expect(alvo).toBeDefined();

    const resultado = computeCompatibility(
      [{ criterion: "ABORDAGEM_INICIAL", weight: 100, targetValue: alvo!.value, evidence: "e" }],
      PROVIDER,
    );
    expect(resultado.criteria[0]!.alignment).toBe(100);
  });

  it("o alvo de localização casa com a UF do profissional", () => {
    const alvo = UF_OPTIONS.find((o) => o.value === "SP")!;
    const resultado = computeCompatibility(
      [{ criterion: "LOCALIZACAO", weight: 100, targetValue: alvo.value, evidence: "e" }],
      PROVIDER,
    );
    expect(resultado.criteria[0]!.alignment).toBe(100);
  });

  it("texto livre não casaria — é por isso que a opção é fechada", () => {
    // "São Paulo" por extenso é o erro natural de um campo de texto. O Motor
    // não erra: ele simplesmente não alinha, em silêncio.
    const resultado = computeCompatibility(
      [{ criterion: "LOCALIZACAO", weight: 100, targetValue: "São Paulo", evidence: "e" }],
      PROVIDER,
    );
    expect(resultado.criteria[0]!.alignment).not.toBe(100);
  });
});

describe("a validação destrava quando o alvo é declarado", () => {
  const base = { criterion: "LOCALIZACAO" as const, weight: 100, evidence: "Ela disse que não pode viajar." };

  it("sem alvo, o Perfil não pode ser validado — e a tela diz o porquê", () => {
    const readiness = computePriorityValidationReadiness({
      weights: [{ ...base, targetValue: null }],
      filterCriteria: [],
      validated: false,
    });

    expect(readiness.canValidate).toBe(false);
    // O bloqueio precisa dizer O QUE falta, e levar até o campo — um "não pode
    // validar" sem destino é o beco sem saída que este trabalho eliminou.
    const bloqueio = readiness.blockers.map((b) => b.message).join(" · ");
    expect(bloqueio).toMatch(/alvo/i);
    expect(readiness.blockers.some((b) => b.scrollTargetId)).toBe(true);
  });

  it("com alvo, valida — este era o beco sem saída", () => {
    const readiness = computePriorityValidationReadiness({
      weights: [{ ...base, targetValue: "SP" }],
      filterCriteria: [],
      validated: false,
    });

    expect(readiness.canValidate, readiness.blockers.join(" · ")).toBe(true);
  });
});

describe("o alvo gravado nunca aparece cru em tela", () => {
  it("traduz para o rótulo humano", () => {
    expect(targetLabel("LOCALIZACAO", "SP")).toContain("São Paulo");
    expect(targetLabel("AREA_DE_ATUACAO", "saude_fisica")).toBe("Saúde física");
    expect(targetLabel("ABORDAGEM_INICIAL", "conexao_direta")).toBe("Conexão direta");
  });

  it("valor desconhecido não vira tela em branco", () => {
    expect(targetLabel("LOCALIZACAO", "ZZ")).toBe("ZZ");
    expect(targetLabel("LOCALIZACAO", null)).toBeNull();
  });
});
