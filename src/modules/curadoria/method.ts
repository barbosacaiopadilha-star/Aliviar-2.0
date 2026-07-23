// O Método, em código puro. Sem banco, sem rede, sem IA, sem framework.
//
// Este arquivo é a tradução direta do raciocínio descrito em
// docs/FUNDAMENTOS_DO_METODO_ALIVIAR.md. Toda função aqui é determinística e
// executável isoladamente — o mesmo cálculo poderia ser feito com papel e
// caneta, e daria o mesmo resultado.
//
// Três regras estruturais que este arquivo garante:
//   1. Nada é inventado. Dado ausente no cadastro vira `alignment: null` e
//      uma explicação de lacuna — nunca uma nota baixa disfarçada.
//   2. Nenhuma função aqui seleciona profissional. O cálculo produz análise
//      ordenável; a escolha dos três é do Curador (Princípio 14).
//   3. Toda análise sai acompanhada da sua explicação em linguagem humana —
//      se não pode ser explicada, não pode ser usada (Princípio 8).

import {
  PRIORITY_CRITERION_LABELS,
  type CompatibilityBand,
  type CriterionResult,
  type MandatoryFilterKind,
  type PriorityCriterion,
  type ProviderSnapshot,
} from "./types";

export const TOTAL_PRIORITY_POINTS = 100;

// ---------------------------------------------------------------------------
// Distribuição de pesos
// ---------------------------------------------------------------------------

export type WeightInput = {
  criterion: PriorityCriterion;
  weight: number;
  targetValue?: string | null;
  evidence: string;
};

const CRITERIA_REQUIRING_TARGET_SET = new Set<PriorityCriterion>([
  "AREA_DE_ATUACAO",
  "ABORDAGEM_INICIAL",
  "LOCALIZACAO",
]);

export type WeightValidation = {
  valid: boolean;
  total: number;
  remaining: number;
  errors: string[];
};

// Um peso só existe com evidência. Um Perfil só fecha em exatamente 100
// pontos. As duas regras são verificadas aqui antes de qualquer ida ao banco
// (o banco também as reforça — nunca dependemos só da aplicação).
export function validateWeightDistribution(weights: WeightInput[]): WeightValidation {
  const errors: string[] = [];
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);

  if (weights.length === 0) {
    errors.push("Nenhum critério recebeu peso ainda.");
  }

  if (total !== TOTAL_PRIORITY_POINTS) {
    errors.push(`A distribuição precisa somar exatamente ${TOTAL_PRIORITY_POINTS} pontos — hoje soma ${total}.`);
  }

  const seen = new Set<PriorityCriterion>();
  for (const entry of weights) {
    const label = PRIORITY_CRITERION_LABELS[entry.criterion];

    if (seen.has(entry.criterion)) {
      errors.push(`O critério "${label}" aparece mais de uma vez.`);
    }
    seen.add(entry.criterion);

    if (entry.evidence.trim() === "") {
      errors.push(`O peso de "${label}" está sem evidência — registre o momento da conversa que o originou.`);
    }

    if (entry.weight < 0 || entry.weight > TOTAL_PRIORITY_POINTS) {
      errors.push(`O peso de "${label}" precisa ficar entre 0 e ${TOTAL_PRIORITY_POINTS}.`);
    }

    if (CRITERIA_REQUIRING_TARGET_SET.has(entry.criterion) && !entry.targetValue) {
      errors.push(`O critério "${label}" precisa de um alvo declarado pelo paciente.`);
    }
  }

  return { valid: errors.length === 0, total, remaining: TOTAL_PRIORITY_POINTS - total, errors };
}

// ---------------------------------------------------------------------------
// Filtros obrigatórios — eliminatórios, aplicados antes de qualquer cálculo
// ---------------------------------------------------------------------------

export type MandatoryFilterInput = { kind: MandatoryFilterKind; value: string };

function hasDomain(provider: ProviderSnapshot, value: string): boolean {
  return provider.competencyDomains.some((domain) => domain === value);
}

export type FilterOutcome = {
  passes: boolean;
  // Em linguagem humana: por que este profissional não entrou na comparação.
  failures: string[];
};

export function passesMandatoryFilters(
  provider: ProviderSnapshot,
  filters: MandatoryFilterInput[],
): FilterOutcome {
  const failures: string[] = [];

  for (const filter of filters) {
    switch (filter.kind) {
      case "UF":
        if (provider.crmUf !== filter.value) {
          failures.push(`Não atua em ${filter.value}.`);
        }
        break;
      case "AREA_DE_ATUACAO":
        if (!hasDomain(provider, filter.value)) {
          failures.push("Não tem a área de atuação exigida registrada.");
        }
        break;
      case "CUIDADO_CONTINUO":
        if (provider.offersContinuousCare !== true) {
          failures.push("Não oferece acompanhamento contínuo.");
        }
        break;
      case "DISPONIBILIDADE_IMEDIATA":
        if (provider.availabilityWindow !== "flexible") {
          failures.push("Sem disponibilidade imediata.");
        }
        break;
    }
  }

  return { passes: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Alinhamento por critério
// ---------------------------------------------------------------------------

type Alignment = { alignment: number | null; explanation: string };

const NO_DATA = (what: string): Alignment => ({
  alignment: null,
  explanation: `${what} não está registrado no cadastro deste profissional — nada foi presumido.`,
});

function experienceAlignment(provider: ProviderSnapshot): Alignment {
  switch (provider.experienceLevel) {
    case "altamente_experiente":
      return { alignment: 100, explanation: "Tem trajetória longa na área." };
    case "experiente":
      return { alignment: 70, explanation: "Tem experiência consolidada." };
    case "geral":
      return { alignment: 40, explanation: "Tem experiência geral, não concentrada nesta área." };
    default:
      return NO_DATA("O nível de experiência");
  }
}

function focusAlignment(provider: ProviderSnapshot, target: string | null): Alignment {
  if (provider.competencyDomains.length === 0) return NO_DATA("A área de atuação");
  if (!target) return NO_DATA("A área que o paciente prioriza");

  if (hasDomain(provider, target)) {
    return { alignment: 100, explanation: "Trabalha exatamente com a área que o paciente priorizou." };
  }
  if (hasDomain(provider, "nao_determinado")) {
    return { alignment: 40, explanation: "A área registrada não é específica o bastante para confirmar o encaixe." };
  }
  return { alignment: 0, explanation: "Atua em outra área, diferente da que o paciente priorizou." };
}

function availabilityAlignment(provider: ProviderSnapshot): Alignment {
  switch (provider.availabilityWindow) {
    case "flexible":
      return { alignment: 100, explanation: "Tem agenda aberta para começar logo." };
    case "limited":
      return { alignment: 60, explanation: "Tem agenda limitada — o início pode demorar um pouco." };
    case "unavailable_soon":
      return { alignment: 10, explanation: "Não tem agenda para começar no curto prazo." };
    default:
      return NO_DATA("A disponibilidade");
  }
}

function continuityAlignment(provider: ProviderSnapshot): Alignment {
  if (provider.offersContinuousCare === null) return NO_DATA("O acompanhamento contínuo");
  return provider.offersContinuousCare
    ? { alignment: 100, explanation: "Acompanha o paciente ao longo do tempo." }
    : { alignment: 0, explanation: "Atende pontualmente, sem acompanhamento contínuo." };
}

function intakeAlignment(provider: ProviderSnapshot, target: string | null): Alignment {
  if (provider.intakeApproach === null) return NO_DATA("A forma do primeiro encontro");
  if (!target) return NO_DATA("A forma de primeiro encontro que o paciente prefere");

  if (provider.intakeApproach === target) {
    return { alignment: 100, explanation: "O primeiro encontro acontece exatamente como o paciente prefere." };
  }
  if (provider.intakeApproach === "ambos") {
    return { alignment: 85, explanation: "Se adapta à forma de primeiro encontro que o paciente preferir." };
  }
  return { alignment: 30, explanation: "O primeiro encontro acontece de forma diferente da que o paciente prefere." };
}

function locationAlignment(provider: ProviderSnapshot, target: string | null): Alignment {
  if (provider.crmUf === null) return NO_DATA("O estado de atuação");
  if (!target) return NO_DATA("A região que o paciente prioriza");

  return provider.crmUf === target
    ? { alignment: 100, explanation: `Atua em ${target}, a região priorizada pelo paciente.` }
    : { alignment: 20, explanation: `Atua em ${provider.crmUf}, fora da região priorizada.` };
}

function alignmentFor(
  criterion: PriorityCriterion,
  provider: ProviderSnapshot,
  target: string | null,
): Alignment {
  switch (criterion) {
    case "EXPERIENCIA":
      return experienceAlignment(provider);
    case "AREA_DE_ATUACAO":
      return focusAlignment(provider, target);
    case "DISPONIBILIDADE":
      return availabilityAlignment(provider);
    case "CONTINUIDADE":
      return continuityAlignment(provider);
    case "ABORDAGEM_INICIAL":
      return intakeAlignment(provider, target);
    case "LOCALIZACAO":
      return locationAlignment(provider, target);
  }
}

// ---------------------------------------------------------------------------
// Compatibilidade
// ---------------------------------------------------------------------------

export type CompatibilityResult = {
  internalScore: number;
  band: CompatibilityBand;
  criteria: CriterionResult[];
  criteriaWithoutData: number;
  // Quantos dos 100 pontos do paciente puderam de fato ser avaliados. É a
  // medida honesta da confiança nesta análise — o Curador precisa vê-la.
  coveredWeight: number;
};

// Faixas fixas e documentadas. Existem para que o Curador tenha uma
// referência estável e para que o paciente receba uma leitura qualitativa —
// nunca para produzir um vencedor.
export function bandFor(score: number): CompatibilityBand {
  if (score >= 85) return "MUITO_ALTA";
  if (score >= 70) return "ALTA";
  if (score >= 55) return "BOA";
  return "MODERADA";
}

// O score é calculado sobre o peso efetivamente avaliável, não sobre os 100
// pontos cheios: um profissional com cadastro incompleto não é punido com
// nota baixa, ele é sinalizado com `criteriaWithoutData` e `coveredWeight`.
// Ausência de informação nunca vira julgamento.
export function computeCompatibility(weights: WeightInput[], provider: ProviderSnapshot): CompatibilityResult {
  const criteria: CriterionResult[] = [];
  let weightedSum = 0;
  let coveredWeight = 0;
  let criteriaWithoutData = 0;

  for (const entry of weights) {
    const { alignment, explanation } = alignmentFor(entry.criterion, provider, entry.targetValue ?? null);

    if (alignment === null) {
      criteriaWithoutData += 1;
      criteria.push({ criterion: entry.criterion, weight: entry.weight, alignment: null, contribution: 0, explanation });
      continue;
    }

    const contribution = round2((entry.weight * alignment) / 100);
    weightedSum += contribution;
    coveredWeight += entry.weight;
    criteria.push({ criterion: entry.criterion, weight: entry.weight, alignment, contribution, explanation });
  }

  const internalScore = coveredWeight === 0 ? 0 : round2((weightedSum / coveredWeight) * 100);

  return { internalScore, band: bandFor(internalScore), criteria, criteriaWithoutData, coveredWeight };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Ordenação — organizar, nunca escolher
// ---------------------------------------------------------------------------

export type RankableAnalysis = { professionalProfileId: string; internalScore: number };

// Ordena para leitura do Curador. Não corta, não seleciona, não devolve "os
// três" — a seleção final das opções pertence exclusivamente ao Curador
// (Princípio 14). Empate mantém a ordem estável de entrada, nunca um
// desempate arbitrário que pareceria uma decisão.
export function organizeForCurator<T extends RankableAnalysis>(analyses: T[]): T[] {
  return [...analyses]
    .map((analysis, index) => ({ analysis, index }))
    .sort((a, b) => b.analysis.internalScore - a.analysis.internalScore || a.index - b.index)
    .map((entry) => entry.analysis);
}

export const REQUIRED_OPTION_COUNT = 3;

export function validateSelection(professionalProfileIds: string[]): { valid: boolean; error: string | null } {
  if (professionalProfileIds.length !== REQUIRED_OPTION_COUNT) {
    return {
      valid: false,
      error: `A Curadoria apresenta sempre exatamente três opções — hoje há ${professionalProfileIds.length}.`,
    };
  }
  if (new Set(professionalProfileIds).size !== professionalProfileIds.length) {
    return { valid: false, error: "O mesmo profissional foi selecionado mais de uma vez." };
  }
  return { valid: true, error: null };
}
