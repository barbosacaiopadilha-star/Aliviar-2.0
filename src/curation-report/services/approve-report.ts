import type { CurationReportSnapshot } from "../model/curation-report";
import type { CurationReportMutationDependencies, CurationReportServiceResult } from "./service-helpers";
import { loadReportAggregate, persistReportAggregate } from "./service-helpers";

export interface ApproveReportInput {
  reportId: string;
  actorId: string;
}

export async function approveReport(
  deps: CurationReportMutationDependencies,
  input: ApproveReportInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const loaded = await loadReportAggregate(deps, input.reportId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.approve({
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistReportAggregate(deps, mutated.value);
}
