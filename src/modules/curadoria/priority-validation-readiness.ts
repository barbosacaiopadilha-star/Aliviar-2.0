import { TOTAL_PRIORITY_POINTS, validateWeightDistribution, type WeightInput } from "./method";
import { PRIORITY_CRITERION_LABELS, type PriorityCriterion } from "./types";

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

export type PriorityValidationBlocker = {
  message: string;
  /** Elemento DOM para scroll automático ao clicar na pendência. */
  scrollTargetId: string | null;
};

export type PriorityValidationReadiness = {
  status: PriorityValidationStatus;
  blockers: PriorityValidationBlocker[];
  canValidate: boolean;
  total: number;
  remaining: number;
};

function criterionScrollTarget(criterion: PriorityCriterion): string {
  return `criterio-${criterion}`;
}

function resolveScrollTargetForError(
  message: string,
  weights: WeightInput[],
  filterCriteria: PriorityCriterion[],
): string | null {
  if (message.includes("Nenhum critério")) {
    return "priority-add-criterion";
  }

  if (message.includes("soma exatamente") || message.includes("Faltam")) {
    return weights.length > 0 ? criterionScrollTarget(weights[0]!.criterion) : "priority-add-criterion";
  }

  if (message.includes("filtro obrigatório e como critério")) {
    const conflict = weights.find((entry) => filterCriteria.includes(entry.criterion));
    return conflict ? criterionScrollTarget(conflict.criterion) : null;
  }

  for (const entry of weights) {
    const label = PRIORITY_CRITERION_LABELS[entry.criterion];
    if (message.includes(label)) {
      if (message.includes("evidência")) {
        return `evidencia-${entry.criterion}`;
      }
      return criterionScrollTarget(entry.criterion);
    }
  }

  return null;
}

function buildBlockers(
  messages: string[],
  weights: WeightInput[],
  filterCriteria: PriorityCriterion[],
): PriorityValidationBlocker[] {
  return messages.map((message) => ({
    message,
    scrollTargetId: resolveScrollTargetForError(message, weights, filterCriteria),
  }));
}

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
      blockers: [
        {
          message: "Há inconsistências bloqueando esta etapa. Resolva-as antes de validar.",
          scrollTargetId: null,
        },
      ],
      canValidate: false,
      total: input.weights.reduce((sum, entry) => sum + entry.weight, 0),
      remaining: TOTAL_PRIORITY_POINTS - input.weights.reduce((sum, entry) => sum + entry.weight, 0),
    };
  }

  const distribution = validateWeightDistribution(input.weights);
  const conflicting = input.weights.filter((entry) => input.filterCriteria.includes(entry.criterion));
  const errorMessages = [...distribution.errors];

  if (conflicting.length > 0) {
    errorMessages.push("Um aspecto está como filtro obrigatório e como critério ao mesmo tempo.");
  }

  const total = distribution.total;
  const remaining = distribution.remaining;
  const blockers = buildBlockers(errorMessages, input.weights, input.filterCriteria);

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
    blockers: buildBlockers(
      [`Faltam ${remaining} ${remaining === 1 ? "ponto" : "pontos"} para fechar os 100.`],
      input.weights,
      input.filterCriteria,
    ),
    canValidate: false,
    total,
    remaining,
  };
}
