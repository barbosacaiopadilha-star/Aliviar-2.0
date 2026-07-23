import type { CurationProcessSnapshot } from "../model/curation-process";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface CancelProcessInput {
  processId: string;
  actorId: string;
  reason: string;
}

export async function cancelProcess(
  deps: CurationProcessMutationDependencies,
  input: CancelProcessInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.cancel(input.reason, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
