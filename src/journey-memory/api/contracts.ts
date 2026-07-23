import type { MemoryAudience } from "../model/memory-audience";
import type { NoteVisibility } from "../model/memory-note";
import type { NarrativeProjection } from "../projection/narrative-projection";
import type { JourneyMemory } from "../model/journey-memory";

export interface BuildMemoryRequest {
  journeyId: string;
  audience: MemoryAudience;
  actorId: string;
}

export interface BuildMemoryResponse {
  memory: JourneyMemory;
}

export interface AppendTimelineRequest {
  journeyId: string;
  audience: MemoryAudience;
  actorId: string;
  title: string;
  body?: string | null;
  category?: string | null;
  occurredAt: string;
}

export interface AppendTimelineResponse {
  entryId: string;
}

export interface AddNoteRequest {
  journeyId: string;
  audience: MemoryAudience;
  createdBy: string;
  content: string;
  visibility: NoteVisibility[];
}

export interface AddNoteResponse {
  noteId: string;
}

export interface ReferenceAttachmentRequest {
  journeyId: string;
  audience: MemoryAudience;
  referencedBy: string;
  externalRef: string;
  displayName: string;
  mimeType?: string | null;
  category?: string | null;
  note?: string | null;
}

export interface ReferenceAttachmentResponse {
  referenceId: string;
}

export interface ProjectNarrativeRequest {
  journeyId: string;
  audience: MemoryAudience;
  actorId: string;
}

export interface ProjectNarrativeResponse {
  narrative: NarrativeProjection;
}

export type JourneyMemoryApiErrorCode = "FORBIDDEN" | "DOMAIN_ERROR";

export interface JourneyMemoryApiError {
  code: JourneyMemoryApiErrorCode;
  message: string;
}

export type JourneyMemoryApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: JourneyMemoryApiError };
