// Model
export type { CaseContext, CaseSource, CaseStatus } from "./model/case-context";
export { createCaseContext } from "./model/case-context";

export type { JourneyOwnership } from "./model/journey-ownership";
export { createJourneyOwnership, primaryOwnerId } from "./model/journey-ownership";

export type { PatientRecord, NewPatientInput, PatientAssociation } from "./model/patient";

export type { CaseIntake } from "./model/case-intake";
export { validateCaseIntake } from "./model/case-intake";

export type { CaseRecord } from "./model/case";
export { CaseAggregate } from "./model/case";

// Events
export type { CaseRegistrationEvent, CaseRegistrationEventType } from "./events/case-registration-events";
export { CASE_TIMELINE_TITLES } from "./events/case-registration-events";

// Ports
export type {
  CaseRepositoryPort,
  PatientRepositoryPort,
  IdGeneratorPort,
  ClockPort,
} from "./ports/case-registration-ports";

// Services
export { registerCase } from "./services/register-case";
export type {
  RegisterCaseInput,
  RegisterCaseOutput,
  RegisterCaseDependencies,
  RegisterCaseResult,
} from "./services/register-case";

// API
export type {
  RegisterCaseRequest,
  RegisterCaseResponse,
  CaseRegistrationApiResult,
} from "./api/contracts";
export { handleRegisterCase } from "./api/handlers";
export type { CaseRegistrationHandlerDeps } from "./api/handlers";

// Infrastructure
export {
  InMemoryCaseRepository,
  InMemoryPatientRepository,
} from "./infrastructure/in-memory-repositories";
