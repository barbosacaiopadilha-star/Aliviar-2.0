import { randomUUID } from "node:crypto";

import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";
import { isValidStatusTransition } from "@/modules/journey-commitments/types/commitment";

import type {
  CommitmentRecord,
  CommitmentRepositoryPort,
  CreateCommitmentInput,
} from "../commitments/commitment-record";

export class InMemoryCommitmentRepository implements CommitmentRepositoryPort {
  private readonly records = new Map<string, CommitmentRecord>();

  async create(input: CreateCommitmentInput): Promise<CommitmentRecord> {
    const now = new Date().toISOString();
    const record: CommitmentRecord = {
      id: randomUUID(),
      journeyId: input.journeyId,
      title: input.title,
      assignedTo: input.assignedTo,
      status: "PENDING",
      dueDate: input.dueDate ?? null,
      origin: input.origin,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    };

    this.records.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<CommitmentRecord | null> {
    return this.records.get(id) ?? null;
  }

  async listByJourney(journeyId: string): Promise<CommitmentRecord[]> {
    return [...this.records.values()].filter((record) => record.journeyId === journeyId);
  }

  async updateStatus(
    id: string,
    status: CommitmentStatus,
    occurredAt: string,
  ): Promise<CommitmentRecord> {
    const current = this.records.get(id);
    if (!current) {
      throw new Error(`Compromisso n├úo encontrado: ${id}`);
    }

    if (!isValidStatusTransition(current.status, status)) {
      throw new Error(`Transi├º├úo inv├ílida: ${current.status} ÔåÆ ${status}`);
    }

    const updated: CommitmentRecord = {
      ...current,
      status,
      updatedAt: occurredAt,
      completedAt: status === "COMPLETED" ? occurredAt : current.completedAt,
      cancelledAt: status === "CANCELLED" ? occurredAt : current.cancelledAt,
    };

    this.records.set(id, updated);
    return updated;
  }
}
