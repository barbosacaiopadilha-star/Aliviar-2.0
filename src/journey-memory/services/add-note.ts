import { noteAddedEvent, timelineAppendedEvent } from "../events/memory-events";
import type { MemoryNote } from "../model/memory-note";
import type { MemoryAudience } from "../model/memory-audience";
import type { AddNoteInput } from "../model/memory-note";
import type {
  ClockPort,
  IdGeneratorPort,
  MemoryAccessPort,
  NoteRepositoryPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";
import type { JourneyMemoryServiceResult } from "./build-journey-memory";

export interface AddNoteServiceInput extends AddNoteInput {
  audience: MemoryAudience;
}

export interface AddNoteDependencies {
  noteRepository: NoteRepositoryPort;
  timelineRepository: TimelineEntryRepositoryPort;
  access: MemoryAccessPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

export async function addNote(
  deps: AddNoteDependencies,
  input: AddNoteServiceInput,
): Promise<JourneyMemoryServiceResult<MemoryNote>> {
  const allowed = await deps.access.canWrite(input.journeyId, input.audience, input.createdBy);
  if (!allowed) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Sem permissão para adicionar nota." } };
  }

  if (!input.content.trim()) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Conteúdo da nota é obrigatório." } };
  }

  if (input.visibility.length === 0) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Nota precisa de ao menos um escopo de visibilidade." } };
  }

  const createdAt = deps.clock.now();
  const note: MemoryNote = {
    id: deps.idGenerator.nextId(),
    journeyId: input.journeyId,
    content: input.content.trim(),
    visibility: input.visibility,
    createdBy: input.createdBy,
    createdAt,
  };

  const saved = await deps.noteRepository.save(note);

  const timelineEntry = await deps.timelineRepository.append(
    {
      journeyId: input.journeyId,
      kind: "NOTE",
      source: "MEMORY",
      title: "Nota registrada",
      body: saved.content,
      occurredAt: createdAt,
      actorId: input.createdBy,
      originId: saved.id,
    },
    createdAt,
    deps.idGenerator.nextId(),
  );

  void noteAddedEvent(input.journeyId, saved.id, createdAt);
  void timelineAppendedEvent(input.journeyId, timelineEntry.id, createdAt);

  return { ok: true, value: saved };
}
