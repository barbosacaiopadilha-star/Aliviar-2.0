import type { ReportStatus } from "./report-status";

export interface ReportVersion {
  version: number;
  summary: string;
  status: ReportStatus;
  changedAt: string;
  changedBy: string;
}
