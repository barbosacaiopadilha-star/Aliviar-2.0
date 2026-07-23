export type { MemoryAudience, MemoryConsumerRole } from "./model/memory-audience";
export {
  MEMORY_AUDIENCE_LABELS,
  roleToMemoryAudience,
} from "./model/memory-audience";

export type { JourneyMemory, JourneyMemoryQuery } from "./model/journey-memory";
export type {
  MemoryTimelineEntry,
  MemoryTimelineKind,
  AppendTimelineEntryInput,
} from "./model/memory-timeline-entry";
export type { MemoryNote, NoteVisibility, AddNoteInput } from "./model/memory-note";
export type {
  AttachmentReference,
  ReferenceAttachmentInput,
} from "./model/attachment-reference";

export type { CommitmentsView, CommitmentsViewItem } from "./projection/commitments-view";
export { buildCommitmentsView } from "./projection/commitments-view";
export type {
  NarrativeProjection,
  NarrativeSegment,
  NarrativeProvenance,
  AttachmentReferenceSummary,
} from "./projection/narrative-projection";
export { projectNarrative } from "./projection/narrative-projection";

export type {
  JourneyMemoryEvent,
  JourneyMemoryEventType,
} from "./events/memory-events";
export {
  timelineAppendedEvent,
  noteAddedEvent,
  attachmentReferencedEvent,
  memoryBuiltEvent,
} from "./events/memory-events";

export type {
  ClockPort,
  IdGeneratorPort,
  TimelineEntryRepositoryPort,
  NoteRepositoryPort,
  AttachmentReferenceRepositoryPort,
  CommitmentSourcePort,
  MemoryAccessPort,
} from "./ports/journey-memory-ports";

export { buildJourneyMemory } from "./services/build-journey-memory";
export type {
  BuildJourneyMemoryInput,
  BuildJourneyMemoryDependencies,
  JourneyMemoryServiceError,
  JourneyMemoryServiceResult,
} from "./services/build-journey-memory";
export { appendTimelineEntry } from "./services/append-timeline-entry";
export { addNote } from "./services/add-note";
export { referenceAttachment } from "./services/reference-attachment";
export { projectNarrativeForAudience } from "./services/project-narrative";

export {
  FixedClock,
  SequentialIdGenerator,
  InMemoryTimelineRepository,
  InMemoryNoteRepository,
  InMemoryAttachmentReferenceRepository,
  InMemoryCommitmentSource,
  PermissiveMemoryAccess,
  DenyMemoryAccess,
  createInMemoryJourneyMemoryStack,
} from "./infrastructure/in-memory-repositories";

export type {
  BuildMemoryRequest,
  BuildMemoryResponse,
  AppendTimelineRequest,
  AppendTimelineResponse,
  AddNoteRequest,
  AddNoteResponse,
  ReferenceAttachmentRequest,
  ReferenceAttachmentResponse,
  ProjectNarrativeRequest,
  ProjectNarrativeResponse,
  JourneyMemoryApiResult,
} from "./api/contracts";
export {
  handleBuildMemory,
  handleAppendTimeline,
  handleAddNote,
  handleReferenceAttachment,
  handleProjectNarrative,
} from "./api/handlers";
export type { JourneyMemoryHandlerDependencies } from "./api/handlers";
