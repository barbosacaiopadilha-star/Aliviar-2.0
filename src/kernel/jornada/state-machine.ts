import type { OperationalStage } from "./operational-stage";
import {
  isTerminalStage,
  nextOperationalStage,
  operationalStageIndex,
} from "./operational-stage";

export type TransitionFailureReason =
  | "INVALID_STAGE"
  | "JOURNEY_CLOSED"
  | "JOURNEY_BLOCKED"
  | "INVALID_TRANSITION"
  | "SKIP_NOT_ALLOWED"
  | "ALREADY_AT_STAGE";

export interface TransitionContext {
  currentStage: OperationalStage;
  isBlocked: boolean;
  isClosed: boolean;
}

export interface TransitionResult {
  ok: true;
  fromStage: OperationalStage;
  toStage: OperationalStage;
}

export interface TransitionFailure {
  ok: false;
  reason: TransitionFailureReason;
  message: string;
}

export type EvaluateTransitionResult = TransitionResult | TransitionFailure;

export function canAdvance(context: TransitionContext): boolean {
  if (context.isClosed || isTerminalStage(context.currentStage)) {
    return false;
  }
  if (context.isBlocked) {
    return false;
  }
  return nextOperationalStage(context.currentStage) !== null;
}

export function evaluateAdvance(context: TransitionContext): EvaluateTransitionResult {
  if (context.isClosed || isTerminalStage(context.currentStage)) {
    return {
      ok: false,
      reason: "JOURNEY_CLOSED",
      message: "Jornada encerrada n├úo pode avan├ºar.",
    };
  }

  if (context.isBlocked) {
    return {
      ok: false,
      reason: "JOURNEY_BLOCKED",
      message: "Jornada bloqueada n├úo pode avan├ºar.",
    };
  }

  const next = nextOperationalStage(context.currentStage);
  if (!next) {
    return {
      ok: false,
      reason: "INVALID_TRANSITION",
      message: "N├úo h├í pr├│xima etapa operacional.",
    };
  }

  return {
    ok: true,
    fromStage: context.currentStage,
    toStage: next,
  };
}

export function evaluateAdvanceTo(
  context: TransitionContext,
  target: OperationalStage,
): EvaluateTransitionResult {
  if (!isValidOperationalStage(target)) {
    return {
      ok: false,
      reason: "INVALID_STAGE",
      message: `Etapa operacional inv├ílida: ${target}.`,
    };
  }

  if (context.currentStage === target) {
    return {
      ok: false,
      reason: "ALREADY_AT_STAGE",
      message: `Jornada j├í est├í na etapa ${target}.`,
    };
  }

  const direct = evaluateAdvance(context);
  if (direct.ok && direct.toStage === target) {
    return direct;
  }

  const fromIndex = operationalStageIndex(context.currentStage);
  const toIndex = operationalStageIndex(target);

  if (toIndex <= fromIndex) {
    return {
      ok: false,
      reason: "INVALID_TRANSITION",
      message: "Retrocesso de etapa n├úo ├® permitido.",
    };
  }

  if (toIndex - fromIndex > 1) {
    return {
      ok: false,
      reason: "SKIP_NOT_ALLOWED",
      message: "Avan├ºo deve ser sequencial ÔÇö uma etapa por vez.",
    };
  }

  return evaluateAdvance(context);
}

export function canBlock(context: TransitionContext): boolean {
  return !context.isClosed && !isTerminalStage(context.currentStage) && !context.isBlocked;
}

export function canResume(context: TransitionContext): boolean {
  return !context.isClosed && context.isBlocked;
}

function isValidOperationalStage(stage: string): stage is OperationalStage {
  return operationalStageIndex(stage as OperationalStage) >= 0;
}
