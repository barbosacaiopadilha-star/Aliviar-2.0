import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";
import type {
  DoctorCandidate,
  Evidence,
  PublicationDecision,
} from "@/alicia/protocol-engine";

export type PublicCatalogRecord = DoctorImportRecord;

export type PublicationDraft = {
  id: string;
  candidateId: string;
  caseId: string;
  doctorId: string;
  protocolVersion: string;
  protocolDecisionId: string;
  evidenceReportId: string;
  auditRefs: string[];
  lastVerifiedAt: string;
  payload: PublicCatalogRecord;
  createdAt: string;
};

export type PreflightStatus = "READY_TO_PUBLISH" | "PUBLICATION_BLOCKED";

export type PreflightBlockCode =
  | "NOT_AUTO_PUBLISH"
  | "CRM_MISSING"
  | "CRM_INVALID"
  | "RQE_MISSING"
  | "SPECIALTY_OUT_OF_SCOPE"
  | "IDENTITY_CONFLICT"
  | "INVALID_CITY"
  | "INVALID_COORDINATES"
  | "INSUFFICIENT_SOURCES"
  | "INVALID_URL"
  | "REQUIRED_FIELD_MISSING"
  | "INTERNAL_SENTINEL"
  | "PROMOTIONAL_LANGUAGE"
  | "RANKING_LANGUAGE"
  | "DUPLICATE_CRM"
  | "DUPLICATE_SLUG"
  | "SCHEMA_INVALID"
  | "PRIVATE_DATA_LEAK";

export type PreflightBlock = {
  code: PreflightBlockCode;
  message: string;
  field?: string;
};

export type PreflightResult = {
  status: PreflightStatus;
  blocks: PreflightBlock[];
};

export type ImmutableSnapshot = {
  snapshotId: string;
  doctorId: string;
  profileVersion: number;
  payload: PublicCatalogRecord;
  deterministicHash: string;
  protocolVersion: string;
  protocolDecisionId: string;
  evidenceReportId: string;
  createdAt: string;
  publishedAt: string | null;
  supersedesSnapshotId: string | null;
  idempotencyKey: string;
};

export type UpdateClassification =
  | "NO_CHANGE"
  | "MINOR_UPDATE"
  | "MATERIAL_UPDATE"
  | "REVIEW_REQUIRED";

export type PipelineInput = {
  candidate: DoctorCandidate;
  evidence: Evidence[];
  decision: PublicationDecision;
  protocolDecisionId: string;
  evidenceReportId: string;
};

export type PipelineStatus =
  | "PUBLISHED"
  | "ALREADY_PUBLISHED"
  | "NO_CHANGE"
  | "BLOCKED"
  | "REJECTED"
  | "ROLLBACK_EXECUTED"
  | "VERIFICATION_FAILED";

export type PipelineReviewCaseReason =
  | "PUBLICATION_BLOCKED"
  | "PUBLICATION_INCONSISTENT"
  | "MATERIAL_UPDATE"
  | "REVIEW_REQUIRED"
  | "ROLLBACK_FAILED"
  | "NOT_AUTO_PUBLISH";

export type PipelineReviewCase = {
  candidateId: string;
  caseId: string;
  doctorId: string;
  reason: PipelineReviewCaseReason;
  summary: string;
  blocks: PreflightBlock[];
  createdAt: string;
};

export type PipelineResult = {
  status: PipelineStatus;
  doctorId?: string;
  snapshotId?: string;
  profileVersion?: number;
  updateClassification?: UpdateClassification;
  idempotencyKey?: string;
  reviewCase?: PipelineReviewCase;
  blocks?: PreflightBlock[];
  message?: string;
};

export type PublicationAuditEventType =
  | "PUBLICATION_DRAFTED"
  | "PREFLIGHT_PASSED"
  | "PREFLIGHT_BLOCKED"
  | "SNAPSHOT_STAGED"
  | "PROFILE_PUBLISHED"
  | "POST_PUBLISH_VERIFIED"
  | "PUBLICATION_INCONSISTENT"
  | "PUBLICATION_FAILED"
  | "ROLLBACK_EXECUTED";

export type PublicationAuditEvent = {
  id: string;
  type: PublicationAuditEventType;
  at: string;
  candidateId: string;
  doctorId: string;
  protocolDecisionId: string;
  publicationDraftId?: string;
  snapshotId?: string;
  protocolVersion: string;
  outcome: string;
  reasons: string[];
  evidenceIds: string[];
};

export type RollbackResult = {
  success: boolean;
  restoredSnapshotId: string | null;
  removedSnapshotId: string;
  incidentId: string;
  message: string;
};

export type PostPublishVerificationResult = {
  status: "PUBLICATION_VERIFIED" | "PUBLICATION_INCONSISTENT";
  checks: Array<{ name: string; passed: boolean; message?: string }>;
};
