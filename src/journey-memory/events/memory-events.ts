export type JourneyMemoryEventType =
  | "TIMELINE_ENTRY_APPENDED"
  | "NOTE_ADDED"
  | "ATTACHMENT_REFERENCED"
  | "MEMORY_BUILT";

export interface JourneyMemoryEvent {
  type: JourneyMemoryEventType;
  journeyId: string;
  occurredAt: string;
  payload: Record<string, string>;
}

export function timelineAppendedEvent(
  journeyId: string,
  entryId: string,
  occurredAt: string,
): JourneyMemoryEvent {
  return {
    type: "TIMELINE_ENTRY_APPENDED",
    journeyId,
    occurredAt,
    payload: { entryId },
  };
}

export function noteAddedEvent(
  journeyId: string,
  noteId: string,
  occurredAt: string,
): JourneyMemoryEvent {
  return {
    type: "NOTE_ADDED",
    journeyId,
    occurredAt,
    payload: { noteId },
  };
}

export function attachmentReferencedEvent(
  journeyId: string,
  referenceId: string,
  occurredAt: string,
): JourneyMemoryEvent {
  return {
    type: "ATTACHMENT_REFERENCED",
    journeyId,
    occurredAt,
    payload: { referenceId },
  };
}

export function memoryBuiltEvent(
  journeyId: string,
  entryCount: string,
  occurredAt: string,
): JourneyMemoryEvent {
  return {
    type: "MEMORY_BUILT",
    journeyId,
    occurredAt,
    payload: { entryCount },
  };
}
