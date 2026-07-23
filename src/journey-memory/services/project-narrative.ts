import type { MemoryAudience } from "../model/memory-audience";
import type { JourneyMemory } from "../model/journey-memory";
import type { MemoryAccessPort } from "../ports/journey-memory-ports";
import { projectNarrative, type NarrativeProjection } from "../projection/narrative-projection";
import type { JourneyMemoryServiceResult } from "./build-journey-memory";
import type { ClockPort } from "../ports/journey-memory-ports";

export interface ProjectNarrativeInput {
  memory: JourneyMemory;
  audience: MemoryAudience;
  actorId: string;
}

export interface ProjectNarrativeDependencies {
  access: MemoryAccessPort;
  clock: ClockPort;
}

export async function projectNarrativeForAudience(
  deps: ProjectNarrativeDependencies,
  input: ProjectNarrativeInput,
): Promise<JourneyMemoryServiceResult<NarrativeProjection>> {
  const allowed = await deps.access.canRead(input.memory.journeyId, input.audience, input.actorId);
  if (!allowed) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Acesso negado à narrativa." } };
  }

  return {
    ok: true,
    value: projectNarrative(input.memory, input.audience, deps.clock.now()),
  };
}
