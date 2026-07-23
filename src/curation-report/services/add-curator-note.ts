import type { CurationReportSnapshot } from "../model/curation-report";
import type { CurationReportMutationDependencies, CurationReportServiceResult } from "./service-helpers";
import { loadReportAggregate, persistReportAggregate } from "./service-helpers";

export interface AddCuratorNoteServiceInput {
  reportId: string;
  actorId: string;
  content: string;
  submitForReview?: boolean;
}

export async function addCuratorNote(
  deps: CurationReportMutationDependencies,
  input: AddCuratorNoteServiceInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const loaded = await loadReportAggregate(deps, input.reportId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.addCuratorNote(deps.ids.nextId(), input.content, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
    submitForReview: input.submitForReview,
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistReportAggregate(deps, mutated.value);
}
