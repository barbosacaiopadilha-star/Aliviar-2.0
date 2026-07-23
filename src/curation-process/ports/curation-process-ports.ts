import type { ReportStatus } from "@/curation-report";

import type { ResearchSession } from "../model/research-session";
import type { ProcessVersion } from "../model/process-version";
import type { CurationProcessSnapshot } from "../model/curation-process";

export interface ClockPort {
  now(): string;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface ReportProcessContextRecord {
  id: string;
  journeyId: string;
  status: ReportStatus;
}

export interface ReportLookupPort {
  findById(reportId: string): Promise<ReportProcessContextRecord | null>;
}

export interface ProcessRepositoryPort {
  save(snapshot: CurationProcessSnapshot): Promise<CurationProcessSnapshot>;
  findById(processId: string): Promise<CurationProcessSnapshot | null>;
  findActiveByReportId(reportId: string): Promise<CurationProcessSnapshot | null>;
  listByReportId(reportId: string): Promise<CurationProcessSnapshot[]>;
}

export interface ProcessVersionRepositoryPort {
  append(processId: string, version: ProcessVersion): Promise<ProcessVersion>;
  listByProcessId(processId: string): Promise<ProcessVersion[]>;
}

export interface ResearchRepositoryPort {
  save(session: ResearchSession): Promise<ResearchSession>;
  findById(sessionId: string): Promise<ResearchSession | null>;
  listByProcessId(processId: string): Promise<ResearchSession[]>;
}
