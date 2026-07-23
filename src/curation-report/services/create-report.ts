import { CurationReportAggregate } from "../model/curation-report";
import type { CurationReportSnapshot } from "../model/curation-report";
import type {
  CurationReportContextDependencies,
  CurationReportMutationDependencies,
  CurationReportServiceResult,
} from "./service-helpers";
import { persistReportAggregate, validateReportContext } from "./service-helpers";

export interface CreateReportInput {
  journeyId: string;
  caseId: string;
  patientId: string;
  sharedContextSummary: string;
  criteriaUsed: string[];
  actorId: string;
}

export interface CreateReportDependencies
  extends CurationReportMutationDependencies,
    CurationReportContextDependencies {}

export async function createReport(
  deps: CreateReportDependencies,
  input: CreateReportInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const context = await validateReportContext(deps, input);
  if (!context.ok) return context;

  const existing = await deps.reportRepository.findByJourneyId(input.journeyId);
  if (existing) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada já possui relatório de curadoria." } };
  }

  const occurredAt = deps.clock.now();
  const aggregate = CurationReportAggregate.create({
    id: deps.ids.nextId(),
    journeyId: input.journeyId,
    caseId: input.caseId,
    patientId: input.patientId,
    sharedContextSummary: input.sharedContextSummary,
    criteriaUsed: input.criteriaUsed,
    actorId: input.actorId,
    occurredAt,
  });

  return persistReportAggregate(deps, aggregate);
}
