import type { CurationProcessSnapshot } from "../model/curation-process";
import { CurationProcessAggregate } from "../model/curation-process";
import type {
  ClockPort,
  IdGeneratorPort,
  ProcessRepositoryPort,
  ProcessVersionRepositoryPort,
  ReportLookupPort,
  ResearchRepositoryPort,
} from "../ports/curation-process-ports";

export type CurationProcessServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type CurationProcessServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CurationProcessServiceError };

export interface CurationProcessPersistenceDependencies {
  processRepository: ProcessRepositoryPort;
  versionRepository: ProcessVersionRepositoryPort;
  clock: ClockPort;
}

export interface CurationProcessMutationDependencies extends CurationProcessPersistenceDependencies {
  researchRepository: ResearchRepositoryPort;
  reportLookup: ReportLookupPort;
  ids: IdGeneratorPort;
}

const ELIGIBLE_REPORT_STATUSES = new Set(["DRAFT", "UNDER_REVIEW"]);

export function isReportEligibleForProcess(status: string): boolean {
  return ELIGIBLE_REPORT_STATUSES.has(status);
}

export async function loadProcessAggregate(
  deps: Pick<CurationProcessPersistenceDependencies, "processRepository">,
  processId: string,
): Promise<CurationProcessServiceResult<CurationProcessAggregate>> {
  const snapshot = await deps.processRepository.findById(processId);
  if (!snapshot) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Processo não encontrado." } };
  }

  const aggregate = CurationProcessAggregate.rehydrate(snapshot);
  if (!aggregate.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: aggregate.error.message } };
  }

  return { ok: true, value: aggregate.value };
}

export async function persistProcessAggregate(
  deps: CurationProcessPersistenceDependencies,
  aggregate: CurationProcessAggregate,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const snapshot = aggregate.toSnapshot();
  const existingVersions = await deps.versionRepository.listByProcessId(snapshot.id);

  for (const version of snapshot.versions) {
    if (!existingVersions.some((item) => item.version === version.version)) {
      await deps.versionRepository.append(snapshot.id, version);
    }
  }

  const saved = await deps.processRepository.save(snapshot);
  return { ok: true, value: saved };
}
