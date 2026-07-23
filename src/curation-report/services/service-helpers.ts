import type { CurationReportSnapshot } from "../model/curation-report";
import { CurationReportAggregate } from "../model/curation-report";
import type {
  ClockPort,
  IdGeneratorPort,
  CaseLookupPort,
  JourneyLookupPort,
  PatientLookupPort,
  ReportRepositoryPort,
  ReportVersionRepositoryPort,
} from "../ports/curation-report-ports";

export type CurationReportServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type CurationReportServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CurationReportServiceError };

export interface CurationReportPersistenceDependencies {
  reportRepository: ReportRepositoryPort;
  versionRepository: ReportVersionRepositoryPort;
  clock: ClockPort;
}

export interface CurationReportContextDependencies {
  caseLookup: CaseLookupPort;
  journeyLookup: JourneyLookupPort;
  patientLookup: PatientLookupPort;
}

export interface CurationReportMutationDependencies extends CurationReportPersistenceDependencies {
  ids: IdGeneratorPort;
}

export async function validateReportContext(
  deps: CurationReportContextDependencies,
  input: { journeyId: string; caseId: string; patientId: string },
): Promise<CurationReportServiceResult<void>> {
  const [caseRecord, journey, patient] = await Promise.all([
    deps.caseLookup.findById(input.caseId),
    deps.journeyLookup.findById(input.journeyId),
    deps.patientLookup.findById(input.patientId),
  ]);

  if (!caseRecord) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Caso não encontrado." } };
  }

  if (!journey) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Jornada não encontrada." } };
  }

  if (!patient) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Paciente não encontrado." } };
  }

  if (caseRecord.patientId !== input.patientId) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Caso não pertence ao paciente informado." } };
  }

  if (!caseRecord.journeyId || caseRecord.journeyId !== input.journeyId) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Caso não pertence à jornada informada." } };
  }

  if (journey.patientId !== input.patientId) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada não pertence ao paciente informado." } };
  }

  return { ok: true, value: undefined };
}

export async function loadReportAggregate(
  deps: Pick<CurationReportPersistenceDependencies, "reportRepository">,
  reportId: string,
): Promise<CurationReportServiceResult<CurationReportAggregate>> {
  const snapshot = await deps.reportRepository.findById(reportId);
  if (!snapshot) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Relatório não encontrado." } };
  }

  const aggregate = CurationReportAggregate.rehydrate(snapshot);
  if (!aggregate.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: aggregate.error.message } };
  }

  return { ok: true, value: aggregate.value };
}

export async function persistReportAggregate(
  deps: CurationReportPersistenceDependencies,
  aggregate: CurationReportAggregate,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const snapshot = aggregate.toSnapshot();
  const existingVersions = await deps.versionRepository.listByReportId(snapshot.id);

  for (const version of snapshot.versions) {
    if (!existingVersions.some((item) => item.version === version.version)) {
      await deps.versionRepository.append(snapshot.id, version);
    }
  }

  const saved = await deps.reportRepository.save(snapshot);
  return { ok: true, value: saved };
}
