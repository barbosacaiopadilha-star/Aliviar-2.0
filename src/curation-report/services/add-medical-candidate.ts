import type { AddMedicalCandidateInput } from "../model/medical-candidate";
import type { CurationReportSnapshot } from "../model/curation-report";
import type { CurationReportMutationDependencies, CurationReportServiceResult } from "./service-helpers";
import { loadReportAggregate, persistReportAggregate } from "./service-helpers";

export interface AddMedicalCandidateServiceInput {
  reportId: string;
  actorId: string;
  candidate: AddMedicalCandidateInput;
}

export async function addMedicalCandidate(
  deps: CurationReportMutationDependencies,
  input: AddMedicalCandidateServiceInput,
): Promise<CurationReportServiceResult<CurationReportSnapshot>> {
  const loaded = await loadReportAggregate(deps, input.reportId);
  if (!loaded.ok) return loaded;

  const reasonIds = input.candidate.selectionReasons.map(() => deps.ids.nextId());
  const mutated = loaded.value.addMedicalCandidate(
    deps.ids.nextId(),
    reasonIds,
    input.candidate,
    {
      actorId: input.actorId,
      occurredAt: deps.clock.now(),
    },
  );

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  return persistReportAggregate(deps, mutated.value);
}
