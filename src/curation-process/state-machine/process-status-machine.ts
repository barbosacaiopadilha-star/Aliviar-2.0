import type { ProcessStatus } from "../model/process-status";

const VALID_TRANSITIONS: Record<ProcessStatus, readonly ProcessStatus[]> = {
  CREATED: ["INVESTIGATING", "CANCELLED"],
  INVESTIGATING: ["RESEARCHING", "CANCELLED"],
  RESEARCHING: ["COMPARING", "CANCELLED"],
  COMPARING: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["READY_FOR_APPROVAL", "CANCELLED"],
  READY_FOR_APPROVAL: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionProcessStatus(from: ProcessStatus, to: ProcessStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertProcessStatusTransition(from: ProcessStatus, to: ProcessStatus): string | null {
  if (from === to) {
    return null;
  }

  if (!canTransitionProcessStatus(from, to)) {
    return `Transição inválida de ${from} para ${to}.`;
  }

  return null;
}

export function canCancelProcess(status: ProcessStatus): boolean {
  return status !== "COMPLETED" && status !== "CANCELLED";
}
