import type { AddEvidenceInput } from "../model/evidence";
import type { CurationReportSnapshot } from "../model/curation-report";
import type { CurationReportMutationDependencies, CurationReportServiceResult } from "./service-helpers";
import { loadReportAggregate, persistReportAggregate } from "./service-helpers";

export interface AddEvidenceServiceInput {
  reportId: string;
  actorId: string;
  evidence: AddEvidenceInput;
}

export async function addEvidence(
  deps: CurationReportMutationDependencies,
  input: AddEvidenceServiceInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const loaded = await loadReportAggregate(deps, input.reportId);
  if (!loaded.ok) return loaded;

  const mutated = loaded.value.addEvidence(deps.ids.nextId(), input.evidence, {
    actorId: input.actorId,
    occurredAt: deps.clock.now(),
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistReportAggregate(deps, mutated.value);
}
