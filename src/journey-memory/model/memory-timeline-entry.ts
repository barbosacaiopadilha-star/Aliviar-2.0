import type {
  JourneyEventCategory,
  JourneyEventSource,
} from "@/modules/journey-events/types/journey-event";

export type MemoryTimelineKind =
  | "EVENT"
  | "NOTE"
  | "ATTACHMENT"
  | "COMMITMENT"
  | "SYSTEM";

export interface MemoryTimelineEntry {
  id: string;
  journeyId: string;
  kind: MemoryTimelineKind;
  category: JourneyEventCategory | null;
  source: JourneyEventSource | "MEMORY";
  title: string;
  body: string | null;
  occurredAt: string;
  recordedAt: string;
  actorId: string;
  /** Referência opcional a nota, anexo ou compromisso de origem. */
  originId: string | null;
}

export interface AppendTimelineEntryInput {
  journeyId: string;
  kind: MemoryTimelineKind;
  category?: JourneyEventCategory | null;
  source?: JourneyEventSource | "MEMORY";
  title: string;
  body?: string | null;
  occurredAt: string;
  actorId: string;
  originId?: string | null;
}
