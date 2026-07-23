import type { ReportStatus } from "./report-status";

export type ReportAuditAction =
  | "REPORT_CREATED"
  | "EVIDENCE_ADDED"
  | "CANDIDATE_ADDED"
  | "NOTE_ADDED"
  | "SUBMITTED_FOR_REVIEW"
  | "APPROVED"
  | "DELIVERED"
  | "ARCHIVED"
  | "VERSION_RECORDED";

export interface ReportAuditEntry {
  id: string;
  action: ReportAuditAction;
  actorId: string;
  occurredAt: string;
  details: string;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus | null;
  version: number;
}
