import type { CurationReportSnapshot } from "../model/curation-report";
import type { ReportVersion } from "../model/report-version";

export interface ClockPort {
  now(): string;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface CaseContextRecord {
  id: string;
  patientId: string;
  journeyId: string | null;
}

export interface JourneyContextRecord {
  id: string;
  patientId: string;
}

export interface PatientContextRecord {
  id: string;
}

export interface CaseLookupPort {
  findById(caseId: string): Promise<CaseContextRecord | null>;
}

export interface JourneyLookupPort {
  findById(journeyId: string): Promise<JourneyContextRecord | null>;
}

export interface PatientLookupPort {
  findById(patientId: string): Promise<PatientContextRecord | null>;
}

export interface ReportRepositoryPort {
  save(snapshot: CurationReportSnapshot): Promise<CurationReportSnapshot>;
  findById(reportId: string): Promise<CurationReportSnapshot | null>;
  findByJourneyId(journeyId: string): Promise<CurationReportSnapshot | null>;
}

export interface ReportVersionRepositoryPort {
  append(reportId: string, version: ReportVersion): Promise<ReportVersion>;
  listByReportId(reportId: string): Promise<ReportVersion[]>;
}
