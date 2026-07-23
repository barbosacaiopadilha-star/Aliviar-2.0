export type { VisitorIntention } from "./model/visitor-intention";
export { VISITOR_INTENTION_LABELS, isVisitorIntention } from "./model/visitor-intention";

export type { PublicChapter } from "./model/public-chapter";
export { PUBLIC_CHAPTER_ORDER, publicChapterIndex, isPublicChapterAfter } from "./model/public-chapter";

export type { HandoffStatus } from "./model/handoff-status";
export { canBootstrap, isHandoffFinished } from "./model/handoff-status";

export type {
  JourneyOwnership,
  JourneyBootstrapResult,
  BootstrapPatientInput,
  BootstrapJourneyInput,
} from "./model/bootstrap-result";

export type {
  JourneyHandoff,
  NarrativeCheckpoint,
  StartHandoffInput,
  AdvanceCheckpointInput,
} from "./model/journey-handoff";

export type { HandoffEvent, HandoffEventType } from "./events/handoff-events";
export {
  handoffStartedEvent,
  handoffCompletedEvent,
  journeyBootstrappedEvent,
} from "./events/handoff-events";

export type { OperationalStateMapping } from "./projection/narrative-mapping";
export {
  mapPublicChapterToEtapa,
  mapIntentionToEtapa,
  resolveOperationalState,
  narrativeMappingIsConsistent,
} from "./projection/narrative-mapping";

export type { PortalContinuationProjection } from "./projection/portal-continuation";
export { projectPortalContinuation } from "./projection/portal-continuation";

export type {
  ClockPort,
  IdGeneratorPort,
  HandoffRepositoryPort,
  JourneyBootstrapPort,
} from "./ports/handoff-ports";

export { startHandoff } from "./services/start-handoff";
export type { HandoffServiceError, HandoffServiceResult } from "./services/start-handoff";
export { advanceHandoffCheckpoint, completeHandoff } from "./services/complete-handoff";
export { bootstrapJourneyFromHandoff } from "./services/bootstrap-journey";
export { projectPortalContinuationFromHandoff } from "./services/project-portal-continuation";

export {
  FixedClock,
  SequentialIdGenerator,
  InMemoryHandoffRepository,
  InMemoryJourneyBootstrapPort,
  createInMemoryHandoffStack,
} from "./infrastructure/in-memory-repositories";

export type {
  StartHandoffRequest,
  StartHandoffResponse,
  CompleteHandoffRequest,
  CompleteHandoffResponse,
  BootstrapJourneyRequest,
  BootstrapJourneyResponse,
  ProjectContinuationRequest,
  ProjectContinuationResponse,
  HandoffApiResult,
} from "./api/contracts";
export {
  handleStartHandoff,
  handleCompleteHandoff,
  handleBootstrapJourney,
  handleProjectContinuation,
} from "./api/handlers";
export type { HandoffHandlerDependencies } from "./api/handlers";
