import type { AttachmentReference } from "./attachment-reference";
import type { MemoryAudience } from "./memory-audience";
import type { MemoryNote } from "./memory-note";
import type { MemoryTimelineEntry } from "./memory-timeline-entry";
import type { CommitmentsView } from "../projection/commitments-view";

/** Agregado de leitura unificado — fonte única para reconstrução da história. */
export interface JourneyMemory {
  journeyId: string;
  timeline: MemoryTimelineEntry[];
  notes: MemoryNote[];
  attachmentReferences: AttachmentReference[];
  commitments: CommitmentsView;
  builtAt: string;
  entryCount: number;
}

export interface JourneyMemoryQuery {
  journeyId: string;
  audience: MemoryAudience;
}
