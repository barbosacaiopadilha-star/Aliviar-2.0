import type { CurationProcessSnapshot } from "../model/curation-process";
import type { ProcessVersion } from "../model/process-version";
import type { ResearchSession } from "../model/research-session";
import type {
  ProcessRepositoryPort,
  ProcessVersionRepositoryPort,
  ReportLookupPort,
  ReportProcessContextRecord,
  ResearchRepositoryPort,
} from "../ports/curation-process-ports";

export class InMemoryProcessRepository implements ProcessRepositoryPort {
  private readonly processes = new Map<string, CurationProcessSnapshot>();

  async save(snapshot: CurationProcessSnapshot): Promise<CurationProcessSnapshot> {
    this.processes.set(snapshot.id, structuredClone(snapshot));
    return structuredClone(snapshot);
  }

  async findById(processId: string): Promise<CurationProcessSnapshot | null> {
    const process = this.processes.get(processId);
    return process ? structuredClone(process) : null;
  }

  async findActiveByReportId(reportId: string): Promise<CurationProcessSnapshot | null> {
    const process = [...this.processes.values()].find(
      (item) =>
        item.reportId === reportId && item.status !== "COMPLETED" && item.status !== "CANCELLED",
    );
    return process ? structuredClone(process) : null;
  }

  async listByReportId(reportId: string): Promise<CurationProcessSnapshot[]> {
    return [...this.processes.values()]
      .filter((item) => item.reportId === reportId)
      .map((item) => structuredClone(item));
  }
}

export class InMemoryProcessVersionRepository implements ProcessVersionRepositoryPort {
  private readonly versions = new Map<string, ProcessVersion[]>();

  async append(processId: string, version: ProcessVersion): Promise<ProcessVersion> {
    const existing = this.versions.get(processId) ?? [];
    existing.push(structuredClone(version));
    this.versions.set(processId, existing);
    return structuredClone(version);
  }

  async listByProcessId(processId: string): Promise<ProcessVersion[]> {
    return structuredClone(this.versions.get(processId) ?? []);
  }
}

export class InMemoryResearchRepository implements ResearchRepositoryPort {
  private readonly sessions = new Map<string, ResearchSession>();

  async save(session: ResearchSession): Promise<ResearchSession> {
    this.sessions.set(session.id, structuredClone(session));
    return structuredClone(session);
  }

  async findById(sessionId: string): Promise<ResearchSession | null> {
    const session = this.sessions.get(sessionId);
    return session ? structuredClone(session) : null;
  }

  async listByProcessId(processId: string): Promise<ResearchSession[]> {
    return [...this.sessions.values()]
      .filter((item) => item.processId === processId)
      .map((item) => structuredClone(item));
  }
}

export class InMemoryReportLookup implements ReportLookupPort {
  constructor(private readonly reports: ReportProcessContextRecord[]) {}

  async findById(reportId: string): Promise<ReportProcessContextRecord | null> {
    return this.reports.find((item) => item.id === reportId) ?? null;
  }
}
