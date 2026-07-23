import { describe, expect, it } from "vitest";

import {
  bandFor,
  computeCompatibility,
  organizeForCurator,
  passesMandatoryFilters,
  validateSelection,
  validateWeightDistribution,
  type WeightInput,
} from "@/modules/curadoria/method";
import type { ProviderSnapshot } from "@/modules/curadoria/types";

function provider(overrides: Partial<ProviderSnapshot> = {}): ProviderSnapshot {
  return {
    professionalProfileId: "p1",
    displayName: "Profissional",
    status: "ativo",
    experienceLevel: "experiente",
    intakeApproach: "avaliacao_inicial",
    offersContinuousCare: true,
    availabilityWindow: "flexible",
    crmUf: "SP",
    competencyDomains: ["saude_emocional_mental"],
    ...overrides,
  };
}

const weights: WeightInput[] = [
  { criterion: "EXPERIENCIA", weight: 35, evidence: "Disse que confia mais em quem já viu muitos casos." },
  { criterion: "DISPONIBILIDADE", weight: 25, evidence: "Precisa começar antes do fim do mês." },
  { criterion: "CONTINUIDADE", weight: 20, evidence: "Não quer recomeçar do zero com outra pessoa." },
  {
    criterion: "AREA_DE_ATUACAO",
    weight: 20,
    targetValue: "saude_emocional_mental",
    evidence: "Priorizou quem trabalha especificamente com saúde emocional.",
  },
];

describe("distribuição de pesos", () => {
  it("aceita uma distribuição que soma exatamente 100 com evidência em todos os pesos", () => {
    const result = validateWeightDistribution(weights);
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it("recusa quando a soma não fecha em 100", () => {
    const result = validateWeightDistribution([{ criterion: "EXPERIENCIA", weight: 60, evidence: "disse isso" }]);
    expect(result.valid).toBe(false);
    expect(result.remaining).toBe(40);
    expect(result.errors.join(" ")).toContain("100 pontos");
  });

  it("recusa um peso sem Evidência de Curadoria", () => {
    const result = validateWeightDistribution([
      { criterion: "EXPERIENCIA", weight: 100, evidence: "   " },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("sem evidência");
  });

  it("recusa um critério que exige alvo declarado pelo paciente sem esse alvo", () => {
    const result = validateWeightDistribution([
      { criterion: "AREA_DE_ATUACAO", weight: 100, evidence: "priorizou isso" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("alvo declarado");
  });

  it("recusa o mesmo critério repetido", () => {
    const result = validateWeightDistribution([
      { criterion: "EXPERIENCIA", weight: 50, evidence: "a" },
      { criterion: "EXPERIENCIA", weight: 50, evidence: "b" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("mais de uma vez");
  });
});

describe("filtros obrigatórios", () => {
  it("elimina quem não atende a um filtro obrigatório, com motivo em linguagem humana", () => {
    const outcome = passesMandatoryFilters(provider({ availabilityWindow: "unavailable_soon" }), [
      { kind: "DISPONIBILIDADE_IMEDIATA", value: "true" },
    ]);
    expect(outcome.passes).toBe(false);
    expect(outcome.failures).toEqual(["Sem disponibilidade imediata."]);
  });

  it("aprova quem atende a todos os filtros", () => {
    const outcome = passesMandatoryFilters(provider(), [
      { kind: "UF", value: "SP" },
      { kind: "CUIDADO_CONTINUO", value: "true" },
      { kind: "AREA_DE_ATUACAO", value: "saude_emocional_mental" },
    ]);
    expect(outcome.passes).toBe(true);
    expect(outcome.failures).toEqual([]);
  });
});

describe("compatibilidade", () => {
  it("é sempre relativa ao Perfil: o mesmo profissional muda de faixa quando os pesos mudam", () => {
    const especialista = provider({ experienceLevel: "altamente_experiente", availabilityWindow: "unavailable_soon" });

    const priorizaExperiencia = computeCompatibility(
      [{ criterion: "EXPERIENCIA", weight: 100, evidence: "é o que mais importa para ele" }],
      especialista,
    );
    const priorizaDisponibilidade = computeCompatibility(
      [{ criterion: "DISPONIBILIDADE", weight: 100, evidence: "precisa começar amanhã" }],
      especialista,
    );

    expect(priorizaExperiencia.band).toBe("MUITO_ALTA");
    expect(priorizaDisponibilidade.band).toBe("MODERADA");
  });

  it("nunca inventa dado ausente — sinaliza a lacuna em vez de pontuar", () => {
    const semCadastro = provider({ experienceLevel: null, availabilityWindow: null });
    const result = computeCompatibility(weights, semCadastro);

    const experiencia = result.criteria.find((entry) => entry.criterion === "EXPERIENCIA");
    expect(experiencia?.alignment).toBeNull();
    expect(experiencia?.contribution).toBe(0);
    expect(experiencia?.explanation).toContain("nada foi presumido");
    expect(result.criteriaWithoutData).toBe(2);
  });

  it("não penaliza cadastro incompleto: o score é calculado sobre o peso avaliável", () => {
    const completo = computeCompatibility(weights, provider());
    const incompleto = computeCompatibility(weights, provider({ experienceLevel: null }));

    expect(incompleto.coveredWeight).toBe(65);
    expect(completo.coveredWeight).toBe(100);
    // Sem o critério em que ele pontuava menos, o score sobe — mas a lacuna
    // fica explícita para o Curador em vez de virar nota baixa silenciosa.
    expect(incompleto.internalScore).toBeGreaterThan(completo.internalScore);
    expect(incompleto.criteriaWithoutData).toBe(1);
  });

  it("devolve uma explicação em linguagem humana para todo critério avaliado", () => {
    const result = computeCompatibility(weights, provider());
    for (const entry of result.criteria) {
      expect(entry.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it("mantém score 0 quando nenhum critério tem dado, sem quebrar", () => {
    const vazio = computeCompatibility(
      weights,
      provider({
        experienceLevel: null,
        availabilityWindow: null,
        offersContinuousCare: null,
        competencyDomains: [],
      }),
    );
    expect(vazio.internalScore).toBe(0);
    expect(vazio.coveredWeight).toBe(0);
    expect(vazio.criteriaWithoutData).toBe(4);
  });

  it("mapeia score para faixa qualitativa nos limites documentados", () => {
    expect(bandFor(100)).toBe("MUITO_ALTA");
    expect(bandFor(85)).toBe("MUITO_ALTA");
    expect(bandFor(84.99)).toBe("ALTA");
    expect(bandFor(70)).toBe("ALTA");
    expect(bandFor(55)).toBe("BOA");
    expect(bandFor(54.99)).toBe("MODERADA");
    expect(bandFor(0)).toBe("MODERADA");
  });
});

describe("organização e seleção", () => {
  it("organiza para leitura do Curador sem cortar a lista", () => {
    const organized = organizeForCurator([
      { professionalProfileId: "a", internalScore: 71 },
      { professionalProfileId: "b", internalScore: 92 },
      { professionalProfileId: "c", internalScore: 84 },
      { professionalProfileId: "d", internalScore: 60 },
    ]);

    expect(organized.map((entry) => entry.professionalProfileId)).toEqual(["b", "c", "a", "d"]);
    // Organizar nunca é selecionar — nenhum corte em três acontece aqui.
    expect(organized).toHaveLength(4);
  });

  it("mantém ordem estável no empate, sem inventar desempate", () => {
    const organized = organizeForCurator([
      { professionalProfileId: "primeiro", internalScore: 80 },
      { professionalProfileId: "segundo", internalScore: 80 },
    ]);
    expect(organized.map((entry) => entry.professionalProfileId)).toEqual(["primeiro", "segundo"]);
  });

  it("exige exatamente três opções", () => {
    expect(validateSelection(["a", "b", "c"]).valid).toBe(true);
    expect(validateSelection(["a", "b"]).valid).toBe(false);
    expect(validateSelection(["a", "b", "c", "d"]).valid).toBe(false);
    expect(validateSelection(["a", "b", "b"]).valid).toBe(false);
  });
});
