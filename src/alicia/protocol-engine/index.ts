export { PROTOCOL_VERSION, SCOPED_SPECIALTIES, SCOPED_STATE } from "./constants";
export { evaluateEvidence } from "./evidence-evaluator";
export { evaluateEligibility, evaluateAllRules } from "./eligibility-engine";
export { decidePublication } from "./publication-decision";
export { AuditTrail, globalAuditTrail } from "./audit-trail";
export { ProtocolEngine, defaultProtocolEngine, evaluateCandidate } from "./protocol-engine";
export {
  classifySourceLevel,
  enrichEvidence,
  isHighTrustLevel,
  isPublishableTrustLevel,
} from "./source-levels";
export {
  ALL_PROTOCOL_RULES,
  ELIGIBILITY_RULES,
  FORMATION_RULES,
  PUBLICATION_RULES,
  executeRules,
  partitionRuleResults,
} from "./rules";
export {
  collectReviewCases,
  createReviewCase,
  evaluateStudioCandidate,
  getSuggestedOperationalLevel,
  isAutoPublishCandidate,
  mapStudioCandidateToDoctorCandidate,
  mapStudioSourcesToEvidence,
} from "./studio-adapter";
export type {
  AuditEntry,
  CrmStatus,
  DoctorCandidate,
  EligibilityOutcome,
  EligibilityResult,
  Evidence,
  EvidenceField,
  EvidenceReport,
  FieldEvidenceStatus,
  FieldVerificationStatus,
  OperationalLevel,
  PublicationDecision,
  PublicationOutcome,
  ReviewCase,
  RuleResult,
  RuleStatus,
  SourceConflict,
  SourceLevel,
} from "./types";
