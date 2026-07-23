import type { CurationProcessSnapshot } from "../model/curation-process";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface CompleteProcessInput {
  processId: string;
  actorId: string;
}

export async function completeProcess(
  deps: CurationProcessMutationDependencies,
  input: CompleteProcessInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.complete({
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
