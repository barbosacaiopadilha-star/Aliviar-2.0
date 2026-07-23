import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";

export type CommitmentOrigin =
  | "MANUAL"
  | "SYSTEM"
  | "STAGE_TRANSITION"
  | "OPERATION";

export interface CommitmentRecord {
  id: string;
  journeyId: string;
  title: string;
  assignedTo: string;
  status: CommitmentStatus;
  dueDate: string | null;
  origin: CommitmentOrigin;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface CreateCommitmentInput {
  journeyId: string;
  title: string;
  assignedTo: string;
  dueDate?: string | null;
  origin: CommitmentOrigin;
  createdBy: string;
}

export interface CommitmentRepositoryPort {
  create(input: CreateCommitmentInput): Promise<CommitmentRecord>;
  findById(id: string): Promise<CommitmentRecord | null>;
  listByJourney(journeyId: string): Promise<CommitmentRecord[]>;
  updateStatus(
    id: string,
    status: CommitmentStatus,
    occurredAt: string,
  ): Promise<CommitmentRecord>;
}
