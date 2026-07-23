import type { JourneyCommitment } from "@/modules/journey-commitments/types/commitment";
import {
  isOverdue,
  sortCommitments,
} from "@/modules/journey-commitments/types/commitment";

export interface CommitmentsViewItem {
  id: string;
  title: string;
  status: JourneyCommitment["status"];
  assignedTo: string;
  dueDate: string | null;
  isOverdue: boolean;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  operationalPriority: "high" | "normal" | "low";
}

export interface CommitmentsView {
  journeyId: string;
  open: CommitmentsViewItem[];
  completed: CommitmentsViewItem[];
  cancelled: CommitmentsViewItem[];
  total: number;
}

function toPriority(commitment: JourneyCommitment): CommitmentsViewItem["operationalPriority"] {
  if (isOverdue(commitment)) return "high";
  if (commitment.status === "IN_PROGRESS") return "normal";
  return "low";
}

function toViewItem(commitment: JourneyCommitment): CommitmentsViewItem {
  return {
    id: commitment.id,
    title: commitment.title,
    status: commitment.status,
    assignedTo: commitment.assigned_to,
    dueDate: commitment.due_date,
    isOverdue: isOverdue(commitment),
    completedAt: commitment.completed_at,
    cancelledAt: commitment.cancelled_at,
    createdAt: commitment.created_at,
    updatedAt: commitment.updated_at,
    operationalPriority: toPriority(commitment),
  };
}

export function buildCommitmentsView(
  journeyId: string,
  commitments: JourneyCommitment[],
): CommitmentsView {
  const sorted = sortCommitments(commitments);
  const items = sorted.map(toViewItem);

  return {
    journeyId,
    open: items.filter((item) => item.status === "PENDING" || item.status === "IN_PROGRESS"),
    completed: items.filter((item) => item.status === "COMPLETED"),
    cancelled: items.filter((item) => item.status === "CANCELLED"),
    total: items.length,
  };
}
