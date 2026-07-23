import type { JourneyCommitment } from "@/modules/journey-commitments/types/commitment";

import type { AttachmentReference } from "../model/attachment-reference";
import type { MemoryAudience } from "../model/memory-audience";
import type { MemoryNote } from "../model/memory-note";
import type { AppendTimelineEntryInput, MemoryTimelineEntry } from "../model/memory-timeline-entry";

export interface ClockPort {
  now(): string;
}

export interface IdGeneratorPort {
  nextId(): string;
}

export interface TimelineEntryRepositoryPort {
  append(input: AppendTimelineEntryInput, recordedAt: string, id: string): Promise<MemoryTimelineEntry>;
  listByJourney(journeyId: string): Promise<MemoryTimelineEntry[]>;
}

export interface NoteRepositoryPort {
  save(note: MemoryNote): Promise<MemoryNote>;
  listByJourney(journeyId: string): Promise<MemoryNote[]>;
}

export interface AttachmentReferenceRepositoryPort {
  save(reference: AttachmentReference): Promise<AttachmentReference>;
  listByJourney(journeyId: string): Promise<AttachmentReference[]>;
}

export interface CommitmentSourcePort {
  listByJourney(journeyId: string): Promise<JourneyCommitment[]>;
}

export interface MemoryAccessPort {
  canRead(journeyId: string, audience: MemoryAudience, actorId: string): Promise<boolean>;
  canWrite(journeyId: string, audience: MemoryAudience, actorId: string): Promise<boolean>;
}
