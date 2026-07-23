import type { CurationProcessSnapshot } from "../model/curation-process";
import { CurationProcessAggregate } from "../model/curation-process";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { isReportEligibleForProcess, persistProcessAggregate } from "./service-helpers";

export interface CreateProcessInput {
  reportId: string;
  curatorId: string;
  actorId: string;
}

export async function createProcess(
  deps: CurationProcessMutationDependencies,
  input: CreateProcessInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const report = await deps.reportLookup.findById(input.reportId);
  if (!report) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Relatório não encontrado." } };
  }

  if (!isReportEligibleForProcess(report.status)) {
    return {
      ok: false,
      error: {
        code: "DOMAIN_ERROR",
        message: "Processo só pode ser criado para relatório em elaboração ou revisão.",
      },
    };
  }

  const existing = await deps.processRepository.findActiveByReportId(input.reportId);
  if (existing) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Já existe processo ativo para este relatório." },
    };
  }

  const occurredAt = deps.clock.now();
  const aggregate = CurationProcessAggregate.create({
    id: deps.ids.nextId(),
    reportId: report.id,
    journeyId: report.journeyId,
    curatorId: input.curatorId,
    actorId: input.actorId,
    occurredAt,
  });

  return persistProcessAggregate(deps, aggregate);
}
