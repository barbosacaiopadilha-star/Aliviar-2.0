export type CommitmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface JourneyCommitment {
  id: string;
  journey_id: string;
  title: string;
  assigned_to: string;
  status: CommitmentStatus;
  due_date: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyCommitmentWithAssignee extends JourneyCommitment {
  assignee?: {
    id: string;
    full_name: string;
  };
}

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const OPEN_COMMITMENT_STATUSES: CommitmentStatus[] = ["PENDING", "IN_PROGRESS"];

export const ALLOWED_STATUS_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  PENDING: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isValidStatusTransition(
  from: CommitmentStatus,
  to: CommitmentStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

export function isOverdue(commitment: JourneyCommitment): boolean {
  if (!commitment.due_date || !OPEN_COMMITMENT_STATUSES.includes(commitment.status)) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(commitment.due_date + "T00:00:00");
  return due < today;
}

export function sortCommitments(
  commitments: JourneyCommitment[],
): JourneyCommitment[] {
  const open = commitments.filter((c) => OPEN_COMMITMENT_STATUSES.includes(c.status));
  const completed = commitments.filter((c) => c.status === "COMPLETED");
  const cancelled = commitments.filter((c) => c.status === "CANCELLED");

  const sortOpen = (a: JourneyCommitment, b: JourneyCommitment) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  return [
    ...open.sort(sortOpen),
    ...completed.sort(
      (a, b) => new Date(b.completed_at ?? b.updated_at).getTime() - new Date(a.completed_at ?? a.updated_at).getTime(),
    ),
    ...cancelled.sort(
      (a, b) => new Date(b.cancelled_at ?? b.updated_at).getTime() - new Date(a.cancelled_at ?? a.updated_at).getTime(),
    ),
  ];
}

export function formatCommitmentDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatCommitmentDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
