import type { ProcessStatus } from "./process-status";

export interface ProcessVersion {
  version: number;
  summary: string;
  status: ProcessStatus;
  changedAt: string;
  changedBy: string;
}
