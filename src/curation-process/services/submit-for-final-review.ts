import type { CurationProcessSnapshot } from "../model/curation-process";
import type { SubmitForFinalReviewInput } from "../model/review-cycle";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface SubmitForFinalReviewServiceInput {
  processId: string;
  actorId: string;
  review: SubmitForFinalReviewInput;
}

export async function submitForFinalReview(
  deps: CurationProcessMutationDependencies,
  input: SubmitForFinalReviewServiceInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.submitForFinalReview(deps.ids.nextId(), input.review, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
