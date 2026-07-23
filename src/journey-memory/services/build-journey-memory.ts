import type { JourneyMemory } from "../model/journey-memory";
import type { MemoryAudience } from "../model/memory-audience";
import { memoryBuiltEvent } from "../events/memory-events";
import type {
  AttachmentReferenceRepositoryPort,
  ClockPort,
  CommitmentSourcePort,
  MemoryAccessPort,
  NoteRepositoryPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";
import { buildCommitmentsView } from "../projection/commitments-view";

export type JourneyMemoryServiceError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type JourneyMemoryServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: JourneyMemoryServiceError };

export interface BuildJourneyMemoryInput {
  journeyId: string;
  audience: MemoryAudience;
  actorId: string;
}

export interface BuildJourneyMemoryDependencies {
  timelineRepository: TimelineEntryRepositoryPort;
  noteRepository: NoteRepositoryPort;
  attachmentRepository: AttachmentReferenceRepositoryPort;
  commitmentSource: CommitmentSourcePort;
  access: MemoryAccessPort;
  clock: ClockPort;
}

export async function buildJourneyMemory(
  deps: BuildJourneyMemoryDependencies,
  input: BuildJourneyMemoryInput,
): Promise<JourneyMemoryServiceResult<JourneyMemory>> {
  const allowed = await deps.access.canRead(input.journeyId, input.audience, input.actorId);
  if (!allowed) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Acesso negado à memória da jornada." } };
  }

  const [timeline, notes, attachmentReferences, rawCommitments] = await Promise.all([
    deps.timelineRepository.listByJourney(input.journeyId),
    deps.noteRepository.listByJourney(input.journeyId),
    deps.attachmentRepository.listByJourney(input.journeyId),
    deps.commitmentSource.listByJourney(input.journeyId),
  ]);

  const builtAt = deps.clock.now();
  const memory: JourneyMemory = {
    journeyId: input.journeyId,
    timeline: [...timeline].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    ),
    notes,
    attachmentReferences,
    commitments: buildCommitmentsView(input.journeyId, rawCommitments),
    builtAt,
    entryCount: timeline.length,
  };

  void memoryBuiltEvent(input.journeyId, String(memory.entryCount), builtAt);

  return { ok: true, value: memory };
}
