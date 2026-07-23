// Model
export type { ProcessStatus } from "./model/process-status";
export { PROCESS_STATUSES, isProcessStatus, isProcessActive, isProcessTerminal } from "./model/process-status";

export type { Investigation, StartInvestigationInput } from "./model/investigation";

export type {
  ResearchSession,
  ResearchFinding,
  RegisterResearchFindingInput,
} from "./model/research-session";

export type { CandidateReview, AddCandidateReviewInput } from "./model/candidate-review";

export type { Comparison, CompareCandidatesInput } from "./model/comparison";

export type { ReviewCycle, SubmitForFinalReviewInput } from "./model/review-cycle";

export type { ProcessVersion } from "./model/process-version";

export type { ProcessAuditEntry, ProcessAuditAction } from "./model/process-audit-entry";
export { PROCESS_AUDIT_ACTIONS } from "./model/process-audit-entry";

export type { CurationProcessSnapshot } from "./model/curation-process";
export { CurationProcessAggregate } from "./model/curation-process";

// State machine
export {
  canTransitionProcessStatus,
  assertProcessStatusTransition,
  canCancelProcess,
} from "./state-machine/process-status-machine";

// Ports
export type {
  ClockPort,
  IdGeneratorPort,
  ReportProcessContextRecord,
  ReportLookupPort,
  ProcessRepositoryPort,
  ProcessVersionRepositoryPort,
  ResearchRepositoryPort,
} from "./ports/curation-process-ports";

// Services
export { createProcess } from "./services/create-process";
export type { CreateProcessInput } from "./services/create-process";

export { startInvestigation } from "./services/start-investigation";
export type { StartInvestigationServiceInput } from "./services/start-investigation";

export { registerResearchFinding } from "./services/register-research-finding";
export type {
  RegisterResearchFindingServiceInput,
  RegisterResearchFindingResult,
} from "./services/register-research-finding";

export { addCandidateReview } from "./services/add-candidate-review";
export type { AddCandidateReviewServiceInput } from "./services/add-candidate-review";

export { compareCandidates } from "./services/compare-candidates";
export type { CompareCandidatesServiceInput } from "./services/compare-candidates";

export { submitForFinalReview } from "./services/submit-for-final-review";
export type { SubmitForFinalReviewServiceInput } from "./services/submit-for-final-review";

export { completeProcess } from "./services/complete-process";
export type { CompleteProcessInput } from "./services/complete-process";

export { cancelProcess } from "./services/cancel-process";
export type { CancelProcessInput } from "./services/cancel-process";

// Infrastructure
export {
  InMemoryProcessRepository,
  InMemoryProcessVersionRepository,
  InMemoryResearchRepository,
  InMemoryReportLookup,
} from "./infrastructure/in-memory-repositories";
