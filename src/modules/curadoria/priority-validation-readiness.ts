import { TOTAL_PRIORITY_POINTS, validateWeightDistribution, type WeightInput } from "./method";
import type { PriorityCriterion } from "./types";

export type PriorityValidationStatus =
  | "incompleto"
  | "pronto_para_revisar"
  | "pronto_para_validar"
  | "validado"
  | "bloqueado";

export type PriorityValidationReadinessInput = {
  weights: WeightInput[];
  filterCriteria: PriorityCriterion[];
  validated: boolean;
  blockingInconsistencies?: number;
};

export type PriorityValidationReadiness = {
  status: PriorityValidationStatus;
  blockers: string[];
  canValidate: boolean;
  total: number;
  remaining: number;
};

export function computePriorityValidationReadiness(
  input: PriorityValidationReadinessInput,
): PriorityValidationReadiness {
  if (input.validated) {
    return {
      status: "validado",
      blockers: [],
      canValidate: false,
      total: input.weights.reduce((sum, entry) => sum + entry.weight, 0),
      remaining: 0,
    };
  }

  if ((input.blockingInconsistencies ?? 0) > 0) {
    return {
      status: "bloqueado",
      blockers: ["Há inconsistências bloqueando esta etapa. Resolva-as antes de validar."],
      canValidate: false,
      total: input.weights.reduce((sum, entry) => sum + entry.weight, 0),
      remaining: TOTAL_PRIORITY_POINTS - input.weights.reduce((sum, entry) => sum + entry.weight, 0),
    };
  }

  const distribution = validateWeightDistribution(input.weights);
  const conflicting = input.weights.filter((entry) => input.filterCriteria.includes(entry.criterion));
  const blockers = [...distribution.errors];

  if (conflicting.length > 0) {
    blockers.push("Um aspecto está como filtro obrigatório e como critério ao mesmo tempo.");
  }

  const total = distribution.total;
  const remaining = distribution.remaining;

  if (blockers.length > 0) {
    return {
      status: "incompleto",
      blockers,
      canValidate: false,
      total,
      remaining,
    };
  }

  if (remaining === 0) {
    return {
      status: "pronto_para_validar",
      blockers: [],
      canValidate: true,
      total,
      remaining,
    };
  }

  return {
    status: "pronto_para_revisar",
    blockers: [`Faltam ${remaining} ${remaining === 1 ? "ponto" : "pontos"} para fechar os 100.`],
    canValidate: false,
    total,
    remaining,
  };
}
