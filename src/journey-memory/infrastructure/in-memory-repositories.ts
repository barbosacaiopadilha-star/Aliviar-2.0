import type { JourneyCommitment } from "@/modules/journey-commitments/types/commitment";

import type { AttachmentReference } from "../model/attachment-reference";
import type { MemoryAudience } from "../model/memory-audience";
import type { MemoryNote } from "../model/memory-note";
import type { AppendTimelineEntryInput, MemoryTimelineEntry } from "../model/memory-timeline-entry";
import type {
  AttachmentReferenceRepositoryPort,
  ClockPort,
  CommitmentSourcePort,
  IdGeneratorPort,
  MemoryAccessPort,
  NoteRepositoryPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";

export class FixedClock implements ClockPort {
  constructor(private readonly fixedIso: string) {}

  now(): string {
    return this.fixedIso;
  }
}

export class SequentialIdGenerator implements IdGeneratorPort {
  constructor(private counter = 1, private readonly prefix = "mem") {}

  nextId(): string {
    const id = `${this.prefix}-${this.counter}`;
    this.counter += 1;
    return id;
  }
}

export class InMemoryTimelineRepository implements TimelineEntryRepositoryPort {
  private readonly entries: MemoryTimelineEntry[] = [];

  async append(
    input: AppendTimelineEntryInput,
    recordedAt: string,
    id: string,
  ): Promise<MemoryTimelineEntry> {
    const entry: MemoryTimelineEntry = {
      id,
      journeyId: input.journeyId,
      kind: input.kind,
      category: input.category ?? null,
      source: input.source ?? "MEMORY",
      title: input.title,
      body: input.body ?? null,
      occurredAt: input.occurredAt,
      recordedAt,
      actorId: input.actorId,
      originId: input.originId ?? null,
    };
    this.entries.push(entry);
    return entry;
  }

  async listByJourney(journeyId: string): Promise<MemoryTimelineEntry[]> {
    return this.entries.filter((entry) => entry.journeyId === journeyId);
  }

  all(): MemoryTimelineEntry[] {
    return [...this.entries];
  }
}

export class InMemoryNoteRepository implements NoteRepositoryPort {
  private readonly notes: MemoryNote[] = [];

  async save(note: MemoryNote): Promise<MemoryNote> {
    this.notes.push(note);
    return note;
  }

  async listByJourney(journeyId: string): Promise<MemoryNote[]> {
    return this.notes.filter((note) => note.journeyId === journeyId);
  }
}

export class InMemoryAttachmentReferenceRepository implements AttachmentReferenceRepositoryPort {
  private readonly references: AttachmentReference[] = [];

  async save(reference: AttachmentReference): Promise<AttachmentReference> {
    this.references.push(reference);
    return reference;
  }

  async listByJourney(journeyId: string): Promise<AttachmentReference[]> {
    return this.references.filter((ref) => ref.journeyId === journeyId);
  }
}

export class InMemoryCommitmentSource implements CommitmentSourcePort {
  constructor(private readonly byJourney: Record<string, JourneyCommitment[]> = {}) {}

  async listByJourney(journeyId: string): Promise<JourneyCommitment[]> {
    return this.byJourney[journeyId] ?? [];
  }

  seed(journeyId: string, commitments: JourneyCommitment[]): void {
    this.byJourney[journeyId] = commitments;
  }
}

const WRITE_AUDIENCES = new Set<MemoryAudience>(["CURATORIA", "OPERACAO", "GOVERNANCA"]);

export class PermissiveMemoryAccess implements MemoryAccessPort {
  async canRead(): Promise<boolean> {
    return true;
  }

  async canWrite(_journeyId: string, audience: MemoryAudience): Promise<boolean> {
    return WRITE_AUDIENCES.has(audience);
  }
}

export class DenyMemoryAccess implements MemoryAccessPort {
  async canRead(): Promise<boolean> {
    return false;
  }

  async canWrite(): Promise<boolean> {
    return false;
  }
}

export interface InMemoryJourneyMemoryStack {
  clock: FixedClock;
  idGenerator: SequentialIdGenerator;
  timelineRepository: InMemoryTimelineRepository;
  noteRepository: InMemoryNoteRepository;
  attachmentRepository: InMemoryAttachmentReferenceRepository;
  commitmentSource: InMemoryCommitmentSource;
  access: PermissiveMemoryAccess;
}

export function createInMemoryJourneyMemoryStack(
  fixedIso = "2026-07-22T12:00:00.000Z",
): InMemoryJourneyMemoryStack {
  return {
    clock: new FixedClock(fixedIso),
    idGenerator: new SequentialIdGenerator(),
    timelineRepository: new InMemoryTimelineRepository(),
    noteRepository: new InMemoryNoteRepository(),
    attachmentRepository: new InMemoryAttachmentReferenceRepository(),
    commitmentSource: new InMemoryCommitmentSource(),
    access: new PermissiveMemoryAccess(),
  };
}
