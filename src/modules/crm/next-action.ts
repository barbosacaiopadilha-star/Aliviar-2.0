import type { CrmAppointmentSummary, CrmTaskSummary } from "./types";

export type NextActionCandidate = {
  at: string;
  source: "task" | "appointment" | "manual";
  label: string;
};

/**
 * Estratégia de próxima ação:
 * 1. Tarefa pendente/em andamento com menor due_at
 * 2. Compromisso futuro agendado com menor start_at
 * 3. Valor manual do contato (quando não houver candidatos automáticos)
 */
export function computeNextActionAt(input: {
  manualNextActionAt?: string | null;
  tasks: Pick<CrmTaskSummary, "status" | "dueAt" | "title">[];
  appointments: Pick<CrmAppointmentSummary, "status" | "startAt" | "title">[];
  now?: Date;
}): { nextActionAt: string | null; candidate: NextActionCandidate | null } {
  const now = input.now ?? new Date();
  const candidates: NextActionCandidate[] = [];

  for (const task of input.tasks) {
    if (task.status === "concluida" || task.status === "cancelada") continue;
    if (!task.dueAt) continue;
    candidates.push({
      at: task.dueAt,
      source: "task",
      label: task.title,
    });
  }

  for (const appointment of input.appointments) {
    if (appointment.status === "cancelado" || appointment.status === "concluido") continue;
    const start = new Date(appointment.startAt);
    if (start.getTime() < now.getTime()) continue;
    candidates.push({
      at: appointment.startAt,
      source: "appointment",
      label: appointment.title,
    });
  }

  if (input.manualNextActionAt) {
    candidates.push({
      at: input.manualNextActionAt,
      source: "manual",
      label: "Próxima ação manual",
    });
  }

  if (candidates.length === 0) {
    return { nextActionAt: null, candidate: null };
  }

  candidates.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const winner = candidates[0];
  return { nextActionAt: winner.at, candidate: winner };
}

export function isOverdue(dueAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < now.getTime();
}
