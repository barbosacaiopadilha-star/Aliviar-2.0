import type { CurationProcessSnapshot } from "../model/curation-process";
import type { StartInvestigationInput } from "../model/investigation";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface StartInvestigationServiceInput {
  processId: string;
  actorId: string;
  investigation: StartInvestigationInput;
}

export async function startInvestigation(
  deps: CurationProcessMutationDependencies,
  input: StartInvestigationServiceInput,
): Promise<CurationProcessServiceResult<CurationProcessSnapshot>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.startInvestigation(deps.ids.nextId(), input.investigation, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistProcessAggregate(deps, mutated.value);
}
