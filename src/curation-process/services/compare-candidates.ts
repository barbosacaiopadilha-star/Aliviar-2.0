import type { CurationProcessSnapshot } from "../model/curation-process";
import type { CompareCandidatesInput } from "../model/comparison";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface CompareCandidatesServiceInput {
  processId: string;
  actorId: string;
  comparison: CompareCandidatesInput;
}

export async function compareCandidates(
  deps: CurationProcessMutationDependencies,
  input: CompareCandidatesServiceInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.compareCandidates(deps.ids.nextId(), input.comparison, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
