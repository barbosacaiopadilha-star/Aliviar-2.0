import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

export type DoctorLifecycleState =
  | "discovered"
  | "imported"
  | "normalized"
  | "auto_verified"
  | "human_verified"
  | "published"
  | "updated"
  | "archived";

export type LifecycleTransition = {
  from: DoctorLifecycleState;
  to: DoctorLifecycleState;
  at: string;
  reason?: string;
};

export type LifecycleRecord = {
  state: DoctorLifecycleState;
  stateChangedAt: string;
  history: LifecycleTransition[];
};

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  code: string;
  message: string;
  severity: ValidationSeverity;
  field?: string;
  doctorId?: string;
};

export type ProfileQualityIndicators = {
  coverage: number;
  reliability: number;
  freshness: number;
  sourceCount: number;
  pendingFieldCount: number;
  overall: number;
};

export type CatalogDoctorOperationalRecord = {
  doctorId: string;
  importRecord: DoctorImportRecord;
  lifecycle: LifecycleRecord;
  quality: ProfileQualityIndicators;
  validationIssues: ValidationIssue[];
  reviewQueueItemIds: string[];
};

export type ReviewQueueItem = {
  id: string;
  doctorId: string;
  reason: string;
  field?: string;
  createdAt: string;
  status: "open" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high";
};

export type IngestionSource = "json" | "csv" | "crawler" | "manual";

export type CatalogMetrics = {
  totalDoctors: number;
  coverageByCity: Record<string, number>;
  coverageByState: Record<string, number>;
  coverageBySpecialty: Record<string, number>;
  completeProfiles: number;
  profilesInReview: number;
  averageSourcesPerDoctor: number;
  averageDaysSinceUpdate: number;
};

export type IngestionResult = {
  source: IngestionSource;
  snapshot: CatalogSnapshot;
  operationalRecords: CatalogDoctorOperationalRecord[];
  reviewQueue: ReviewQueueItem[];
  issues: ValidationIssue[];
  metrics: CatalogMetrics;
};

export type PublicationResult = {
  snapshot: CatalogSnapshot;
  publishedDoctorIds: string[];
  blockedDoctorIds: string[];
  issues: ValidationIssue[];
};

export type UpdateResult = {
  updatedDoctorIds: string[];
  unchangedDoctorIds: string[];
  newReviewItems: ReviewQueueItem[];
};

export type DuplicateCandidate = {
  doctorIdA: string;
  doctorIdB: string;
  score: number;
  reasons: string[];
};
