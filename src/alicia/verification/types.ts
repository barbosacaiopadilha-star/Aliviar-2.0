import type { PublicationOutcome } from "@/alicia/protocol-engine";

export type VerificationFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "ON_DEMAND";

export type ChangeClassification =
  | "NO_CHANGE"
  | "MINOR_CHANGE"
  | "MATERIAL_CHANGE"
  | "CONFLICT";

export type VerificationDecisionOutcome =
  | "VERIFIED"
  | "UPDATE_REQUIRED"
  | "REVIEW_REQUIRED"
  | "UNPUBLISH_RECOMMENDED";

export type VerificationRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type PublishedProfileSnapshot = {
  profileId: string;
  candidateId: string;
  doctorName: string;
  crm: string;
  rqe?: string;
  institutions: string[];
  residency: string[];
  specialty: string;
  city: string;
  state: string;
  sources: string[];
  status: string;
  publishedAt: string;
  version: number;
};

export type VerificationProfile = {
  profileId: string;
  candidateId: string;
  lastVerifiedAt: string | null;
  nextVerificationAt: string;
  verificationFrequency: VerificationFrequency;
  snapshot: PublishedProfileSnapshot;
  neverVerified: boolean;
  sourceChanged: boolean;
  newEvidenceAvailable: boolean;
  recentlyPublished: boolean;
};

export type FieldChange = {
  field: string;
  previous: string;
  current: string;
};

export type ChangeDetectionResult = {
  classification: ChangeClassification;
  changes: FieldChange[];
};

export type VerificationDecision = {
  outcome: VerificationDecisionOutcome;
  classification: ChangeClassification;
  protocolOutcome: PublicationOutcome;
  justification: string;
};

export type VerificationHistoryEntry = {
  id: string;
  profileId: string;
  candidateId: string;
  verifiedAt: string;
  verifiedBy: string;
  decision: VerificationDecisionOutcome;
  classification: ChangeClassification;
  previousVersion: number;
  newVersion: number;
  changes: FieldChange[];
  sourcesConsulted: string[];
  correlationId: string;
};

export type VerificationRunResult = {
  runId: string;
  profileId: string;
  candidateId: string;
  status: VerificationRunStatus;
  decision: VerificationDecision;
  change: ChangeDetectionResult;
  sourcesConsulted: string[];
  latencyMs: number;
  correlationId: string;
  error?: string;
};

export type VerificationMetricsSnapshot = {
  profilesVerified: number;
  noChange: number;
  minorChanges: number;
  materialChanges: number;
  conflicts: number;
  averageLatencyMs: number;
  updateRate: number;
  pendingQueue: number;
};

export type VerificationQueueItem = {
  queueId: string;
  profileId: string;
  candidateId: string;
  doctorName: string;
  scheduledAt: string;
  reason: string;
  frequency: VerificationFrequency;
};

export type VerificationCenterSnapshot = {
  queue: VerificationQueueItem[];
  recentRuns: VerificationRunResult[];
  pendingReview: VerificationHistoryEntry[];
  history: VerificationHistoryEntry[];
  metrics: VerificationMetricsSnapshot;
  lastRunAt: string | null;
};
