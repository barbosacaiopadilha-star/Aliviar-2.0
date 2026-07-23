import type { CurationReportSnapshot } from "../model/curation-report";
import type { ReportVersion } from "../model/report-version";
import type {
  CaseContextRecord,
  CaseLookupPort,
  JourneyContextRecord,
  JourneyLookupPort,
  PatientContextRecord,
  PatientLookupPort,
  ReportRepositoryPort,
  ReportVersionRepositoryPort,
} from "../ports/curation-report-ports";

export class InMemoryReportRepository implements ReportRepositoryPort {
  private readonly reports = new Map<string, CurationReportSnapshot>();

  async save(snapshot: CurationReportSnapshot): Promise<CurationReportSnapshot> {
    this.reports.set(snapshot.id, structuredClone(snapshot));
    return structuredClone(snapshot);
  }

  async findById(reportId: string): Promise<CurationReportSnapshot | null> {
    const report = this.reports.get(reportId);
    return report ? structuredClone(report) : null;
  }

  async findByJourneyId(journeyId: string): Promise<CurationReportSnapshot | null> {
    const report = [...this.reports.values()].find((item) => item.journeyId === journeyId);
    return report ? structuredClone(report) : null;
  }
}

export class InMemoryReportVersionRepository implements ReportVersionRepositoryPort {
  private readonly versions = new Map<string, ReportVersion[]>();

  async append(reportId: string, version: ReportVersion): Promise<ReportVersion> {
    const existing = this.versions.get(reportId) ?? [];
    existing.push(structuredClone(version));
    this.versions.set(reportId, existing);
    return structuredClone(version);
  }

  async listByReportId(reportId: string): Promise<ReportVersion[]> {
    return structuredClone(this.versions.get(reportId) ?? []);
  }
}

export class InMemoryCaseLookup implements CaseLookupPort {
  constructor(private readonly cases: CaseContextRecord[]) {}

  async findById(caseId: string): Promise<CaseContextRecord | null> {
    return this.cases.find((item) => item.id === caseId) ?? null;
  }
}

export class InMemoryJourneyLookup implements JourneyLookupPort {
  constructor(private readonly journeys: JourneyContextRecord[]) {}

  async findById(journeyId: string): Promise<JourneyContextRecord | null> {
    return this.journeys.find((item) => item.id === journeyId) ?? null;
  }
}

export class InMemoryPatientLookup implements PatientLookupPort {
  constructor(private readonly patients: PatientContextRecord[]) {}

  async findById(patientId: string): Promise<PatientContextRecord | null> {
    return this.patients.find((item) => item.id === patientId) ?? null;
  }
}
