import type { ProcessStatus } from "./process-status";

export const PROCESS_AUDIT_ACTIONS = [
  "PROCESS_CREATED",
  "INVESTIGATION_STARTED",
  "RESEARCH_FINDING_REGISTERED",
  "CANDIDATE_REVIEW_ADDED",
  "CANDIDATES_COMPARED",
  "SUBMITTED_FOR_FINAL_REVIEW",
  "PROCESS_COMPLETED",
  "PROCESS_CANCELLED",
] as const;

export type ProcessAuditAction = (typeof PROCESS_AUDIT_ACTIONS)[number];

export interface ProcessAuditEntry {
  id: string;
  action: ProcessAuditAction;
  actorId: string;
  occurredAt: string;
  details: string;
  fromStatus: ProcessStatus | null;
  toStatus: ProcessStatus;
  version: number;
}
