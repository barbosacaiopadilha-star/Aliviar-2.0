import type { CurationProcessSnapshot } from "../model/curation-process";
import type { AddCandidateReviewInput } from "../model/candidate-review";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface AddCandidateReviewServiceInput {
  processId: string;
  actorId: string;
  review: AddCandidateReviewInput;
}

export async function addCandidateReview(
  deps: CurationProcessMutationDependencies,
  input: AddCandidateReviewServiceInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.addCandidateReview(deps.ids.nextId(), input.review, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
