export type { OperationalStage } from "./jornada/operational-stage";
export { OPERATIONAL_STAGES } from "./jornada/operational-stage";
export {
  canAdvance,
  canBlock,
  canResume,
  evaluateAdvance,
  evaluateAdvanceTo,
} from "./jornada/state-machine";
export { JourneyKernelAggregate } from "./jornada/journey-kernel-aggregate";
export type { JourneyKernelSnapshot } from "./jornada/journey-kernel-aggregate";
export type { JourneyTransitionEvent } from "./jornada/transition-events";

export type { KernelRole, KernelPermission } from "./rbac/permissions";
export {
  KERNEL_ROLES,
  KERNEL_PERMISSION_MATRIX,
  STAGE_ADVANCE_ROLES,
  kernelRoleHasPermission,
  canAdvanceStage,
} from "./rbac/permissions";
export {
  authorize,
  authorizePatientOwnership,
  authorizeStageAdvance,
} from "./rbac/authorization";
export type { KernelActor } from "./rbac/authorization";

export type { TimelineRecord, AppendTimelineRecordInput } from "./events/timeline-record";
export type { TimelineRepositoryPort } from "./events/timeline-record";
export type {
  CommitmentRecord,
  CommitmentOrigin,
  CommitmentRepositoryPort,
} from "./commitments/commitment-record";

export type {
  JourneyKernelRepositoryPort,
  IdGeneratorPort,
  ClockPort,
} from "./ports/kernel-ports";

export { createJourney, advanceJourney } from "./services/create-journey";
export { registerJourneyEvent, queryJourneyTimeline } from "./services/journey-timeline";
export { createCommitment, completeCommitment, listCommitments } from "./services/journey-commitments";

export type {
  KernelJourneyView,
  CreateJourneyRequest,
  CreateJourneyResponse,
  AdvanceJourneyRequest,
  AdvanceJourneyResponse,
  KernelApiResult,
} from "./api/contracts";

export {
  handleCreateJourney,
  handleAdvanceJourney,
  handleRegisterJourneyEvent,
  handleQueryTimeline,
  handleCreateCommitment,
  handleCompleteCommitment,
} from "./api/handlers";

export { InMemoryJourneyKernelRepository } from "./infrastructure/in-memory-journey-kernel-repository";
export { InMemoryTimelineRepository } from "./infrastructure/in-memory-timeline-repository";
export { InMemoryCommitmentRepository } from "./infrastructure/in-memory-commitment-repository";
