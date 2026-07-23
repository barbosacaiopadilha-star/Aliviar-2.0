import { addNote } from "../services/add-note";
import { appendTimelineEntry } from "../services/append-timeline-entry";
import { buildJourneyMemory } from "../services/build-journey-memory";
import { projectNarrativeForAudience } from "../services/project-narrative";
import { referenceAttachment } from "../services/reference-attachment";
import type {
  AddNoteRequest,
  AddNoteResponse,
  AppendTimelineRequest,
  AppendTimelineResponse,
  BuildMemoryRequest,
  BuildMemoryResponse,
  JourneyMemoryApiResult,
  ProjectNarrativeRequest,
  ProjectNarrativeResponse,
  ReferenceAttachmentRequest,
  ReferenceAttachmentResponse,
} from "./contracts";
import type {
  AttachmentReferenceRepositoryPort,
  ClockPort,
  CommitmentSourcePort,
  IdGeneratorPort,
  MemoryAccessPort,
  NoteRepositoryPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";
import type { JourneyEventCategory } from "@/modules/journey-events/types/journey-event";

export interface JourneyMemoryHandlerDependencies {
  timelineRepository: TimelineEntryRepositoryPort;
  noteRepository: NoteRepositoryPort;
  attachmentRepository: AttachmentReferenceRepositoryPort;
  commitmentSource: CommitmentSourcePort;
  access: MemoryAccessPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

function toApiError<T>(result: { ok: false; error: { code: string; message: string } }): JourneyMemoryApiResult<T> {
  return {
    ok: false,
    error: {
      code: result.error.code as "FORBIDDEN" | "DOMAIN_ERROR",
      message: result.error.message,
    },
  };
}

export async function handleBuildMemory(
  deps: JourneyMemoryHandlerDependencies,
  request: BuildMemoryRequest,
): Promise<JourneyMemoryApiResult<BuildMemoryResponse>> {
  const result = await buildJourneyMemory(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { memory: result.value } };
}

export async function handleAppendTimeline(
  deps: JourneyMemoryHandlerDependencies,
  request: AppendTimelineRequest,
): Promise<JourneyMemoryApiResult<AppendTimelineResponse>> {
  const result = await appendTimelineEntry(deps, {
    journeyId: request.journeyId,
    audience: request.audience,
    actorId: request.actorId,
    kind: "EVENT",
    source: "MANUAL",
    category: (request.category as JourneyEventCategory | null) ?? null,
    title: request.title,
    body: request.body,
    occurredAt: request.occurredAt,
  });
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { entryId: result.value.id } };
}

export async function handleAddNote(
  deps: JourneyMemoryHandlerDependencies,
  request: AddNoteRequest,
): Promise<JourneyMemoryApiResult<AddNoteResponse>> {
  const result = await addNote(deps, {
    journeyId: request.journeyId,
    audience: request.audience,
    createdBy: request.createdBy,
    content: request.content,
    visibility: request.visibility,
  });
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { noteId: result.value.id } };
}

export async function handleReferenceAttachment(
  deps: JourneyMemoryHandlerDependencies,
  request: ReferenceAttachmentRequest,
): Promise<JourneyMemoryApiResult<ReferenceAttachmentResponse>> {
  const result = await referenceAttachment(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { referenceId: result.value.id } };
}

export async function handleProjectNarrative(
  deps: JourneyMemoryHandlerDependencies,
  request: ProjectNarrativeRequest,
): Promise<JourneyMemoryApiResult<ProjectNarrativeResponse>> {
  const memoryResult = await buildJourneyMemory(deps, request);
  if (!memoryResult.ok) return toApiError(memoryResult);

  const narrativeResult = await projectNarrativeForAudience(deps, {
    memory: memoryResult.value,
    audience: request.audience,
    actorId: request.actorId,
  });
  if (!narrativeResult.ok) return toApiError(narrativeResult);

  return { ok: true, value: { narrative: narrativeResult.value } };
}
