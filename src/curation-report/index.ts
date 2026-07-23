// Model
export type { ReportStatus } from "./model/report-status";
export { REPORT_STATUSES, isReportStatus } from "./model/report-status";

export type { Evidence, EvidenceType, AddEvidenceInput } from "./model/evidence";
export { EVIDENCE_TYPES } from "./model/evidence";

export type { SelectionReason, AddSelectionReasonInput } from "./model/selection-reason";

export type { MedicalCandidate, AddMedicalCandidateInput } from "./model/medical-candidate";

export type { CuratorNote } from "./model/curator-note";

export type { ReportVersion } from "./model/report-version";

export type { ReportAuditEntry, ReportAuditAction } from "./model/report-audit-entry";

export type { CurationReportSnapshot } from "./model/curation-report";
export { CurationReportAggregate } from "./model/curation-report";

// State machine
export {
  canTransitionReportStatus,
  assertReportStatusTransition,
  isReportEditable,
} from "./state-machine/report-status-machine";

// Ports
export type {
  ReportRepositoryPort,
  ReportVersionRepositoryPort,
  CaseLookupPort,
  JourneyLookupPort,
  PatientLookupPort,
  CaseContextRecord,
  JourneyContextRecord,
  PatientContextRecord,
  ClockPort,
  IdGeneratorPort,
} from "./ports/curation-report-ports";

// Services
export { createReport } from "./services/create-report";
export type { CreateReportInput, CreateReportDependencies } from "./services/create-report";

export { addEvidence } from "./services/add-evidence";
export type { AddEvidenceServiceInput } from "./services/add-evidence";

export { addMedicalCandidate } from "./services/add-medical-candidate";
export type { AddMedicalCandidateServiceInput } from "./services/add-medical-candidate";

export { addCuratorNote } from "./services/add-curator-note";
export type { AddCuratorNoteServiceInput } from "./services/add-curator-note";

export { approveReport } from "./services/approve-report";
export type { ApproveReportInput } from "./services/approve-report";

export { deliverReport } from "./services/deliver-report";
export type { DeliverReportInput } from "./services/deliver-report";

export { archiveReport } from "./services/archive-report";
export type { ArchiveReportInput } from "./services/archive-report";

// Infrastructure
export {
  InMemoryReportRepository,
  InMemoryReportVersionRepository,
  InMemoryCaseLookup,
  InMemoryJourneyLookup,
  InMemoryPatientLookup,
} from "./infrastructure/in-memory-repositories";
