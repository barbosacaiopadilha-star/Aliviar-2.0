import { timelineAppendedEvent } from "../events/memory-events";
import type { MemoryTimelineEntry, AppendTimelineEntryInput } from "../model/memory-timeline-entry";
import type { MemoryAudience } from "../model/memory-audience";
import type {
  ClockPort,
  IdGeneratorPort,
  MemoryAccessPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";
import type { JourneyMemoryServiceResult } from "./build-journey-memory";

export interface AppendTimelineEntryServiceInput extends AppendTimelineEntryInput {
  audience: MemoryAudience;
}

export interface AppendTimelineEntryDependencies {
  timelineRepository: TimelineEntryRepositoryPort;
  access: MemoryAccessPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

export async function appendTimelineEntry(
  deps: AppendTimelineEntryDependencies,
  input: AppendTimelineEntryServiceInput,
): Promise<JourneyMemoryServiceResult<MemoryTimelineEntry>> {
  const allowed = await deps.access.canWrite(input.journeyId, input.audience, input.actorId);
  if (!allowed) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Sem permissão para registrar evento." } };
  }

  if (!input.title.trim()) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Título do evento é obrigatório." } };
  }

  const recordedAt = deps.clock.now();
  const id = deps.idGenerator.nextId();
  const entry = await deps.timelineRepository.append(input, recordedAt, id);

  void timelineAppendedEvent(input.journeyId, entry.id, recordedAt);

  return { ok: true, value: entry };
}
