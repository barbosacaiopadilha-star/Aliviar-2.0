import type { CurationProcessSnapshot } from "../model/curation-process";
import type { RegisterResearchFindingInput, ResearchSession } from "../model/research-session";
import type { CurationProcessMutationDependencies, CurationProcessServiceResult } from "./service-helpers";
import { loadProcessAggregate, persistProcessAggregate } from "./service-helpers";

export interface RegisterResearchFindingServiceInput {
  processId: string;
  actorId: string;
  finding: RegisterResearchFindingInput;
}

export interface RegisterResearchFindingResult {
  process: CurationProcessSnapshot;
  session: ResearchSession;
}

export async function registerResearchFinding(
  deps: CurationProcessMutationDependencies,
  input: RegisterResearchFindingServiceInput,
): Promise<CurationProcessServiceResult<RegisterResearchFindingResult>> {
  const loaded = await loadProcessAggregate(deps, input.processId);
  if (!loaded.ok) return loaded;

  if (!input.finding.topic.trim() || !input.finding.description.trim()) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Achado de pesquisa exige tópico e descrição." },
    };
  }

  const occurredAt = deps.clock.now();
  const existingSessions = await deps.researchRepository.listByProcessId(input.processId);
  let session = existingSessions.find((item) => item.topic === input.finding.topic.trim()) ?? null;

  if (!session) {
    session = {
      id: deps.ids.nextId(),
      processId: input.processId,
      topic: input.finding.topic.trim(),
      findings: [],
      conductedAt: occurredAt,
      conductedBy: input.actorId,
    };
  }

  session.findings.push({
    id: deps.ids.nextId(),
    description: input.finding.description.trim(),
    source: input.finding.source.trim(),
    recordedAt: occurredAt,
  });

  await deps.researchRepository.save(session);

  const mutated = loaded.value.registerResearchSession(session.id, {
    actorId: input.actorId,
    occurredAt,
  });

  if (!mutated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: mutated.error.message } };
  }

  const persisted = await persistProcessAggregate(deps, mutated.value);
  if (!persisted.ok) return persisted;

  return { ok: true, value: { process: persisted.value, session } };
}
