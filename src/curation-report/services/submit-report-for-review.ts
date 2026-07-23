import type { CurationReportSnapshot } from "../model/curation-report";
import type { CurationReportMutationDependencies, CurationReportServiceResult } from "./service-helpers";
import { loadReportAggregate, persistReportAggregate } from "./service-helpers";

export interface SubmitReportForReviewInput {
  reportId: string;
  actorId: string;
}

export async function submitReportForReview(
  deps: CurationReportMutationDependencies,
  input: SubmitReportForReviewInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const loaded = await loadReportAggregate(deps, input.reportId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.submitForReview({
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistReportAggregate(deps, mutated.value);
}
