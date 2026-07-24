import type { NormalizedConnectorRecord } from "@/alicia/connectors";

import type { COVERAGE_SECTIONS } from "./constants";

export type CoverageSection = (typeof COVERAGE_SECTIONS)[number];

export type EvidenceProvenance = {
  connectorId: string;
  connectorVersion: string;
  sourceName: string;
  sourceUrl: string;
  fetchTimestamp: string;
  rawHash: string;
  normalizationVersion: string;
  confidenceDaFonte: number;
};

export type MergedEvidenceValue = {
  value: string;
  provenance: EvidenceProvenance[];
};

export type NormalizedEvidenceField = {
  field: string;
  values: MergedEvidenceValue[];
};

export type NormalizedCandidateEvidence = {
  candidateKey: string;
  candidateId: string;
  fields: Map<string, NormalizedEvidenceField>;
  rawRecordCount: number;
};

export type EvidenceConflictType =
  | "crm_mismatch"
  | "rqe_mismatch"
  | "specialty_mismatch"
  | "institution_mismatch"
  | "name_mismatch"
  | "city_mismatch";

export type EvidenceConflict = {
  id: string;
  type: EvidenceConflictType;
  field: string;
  values: Array<{ value: string; sources: string[] }>;
  detectedAt: string;
};

export type EvidenceItem = {
  id: string;
  category: string;
  field: string;
  value: string;
  provenance: EvidenceProvenance[];
};

export type CoverageScore = {
  section: CoverageSection;
  percentage: number;
  filledFields: number;
  totalFields: number;
};

export type EvidencePackageIdentity = {
  nome?: string;
  crm?: string;
  crmUf?: string;
  telefone?: string;
};

export type EvidencePackageRegistration = {
  crm: string;
  crmUf: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageEducation = {
  institution?: string;
  degree?: string;
  graduationYear?: string;
  startYear?: string;
  endYear?: string;
  source?: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageResidency = {
  institution?: string;
  program?: string;
  startYear?: string;
  endYear?: string;
  source?: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageFellowship = {
  institution?: string;
  program?: string;
  startYear?: string;
  endYear?: string;
  source?: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageInstitution = {
  name: string;
  url?: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageSpecialty = {
  primary: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackagePracticeLocation = {
  city: string;
  state: string;
  provenance: EvidenceProvenance[];
};

export type EvidencePackageMetadata = {
  createdAt: string;
  updatedAt: string;
  version: number;
  sourceCount: number;
  connectorIds: string[];
  normalizationVersion: string;
  runId: string;
};

export type EvidencePackage = {
  packageId: string;
  candidateId: string;
  identity: EvidencePackageIdentity;
  registrations: EvidencePackageRegistration[];
  education: EvidencePackageEducation[];
  residency: EvidencePackageResidency[];
  fellowship: EvidencePackageFellowship[];
  institutions: EvidencePackageInstitution[];
  specialties: EvidencePackageSpecialty[];
  practiceLocations: EvidencePackagePracticeLocation[];
  evidence: EvidenceItem[];
  conflicts: EvidenceConflict[];
  coverage: CoverageScore[];
  metadata: EvidencePackageMetadata;
};

export type ConnectorEvidenceInput = {
  connectorId: string;
  connectorVersion: string;
  connectorName: string;
  success: boolean;
  records: NormalizedConnectorRecord[];
  fetchedAt: string;
};

export type CollectedRecord = {
  input: ConnectorEvidenceInput;
  record: NormalizedConnectorRecord;
};

export type CollectorResult = {
  candidateKey: string;
  candidateId: string;
  records: CollectedRecord[];
};

export type AcquisitionRunResult = {
  runId: string;
  startedAt: string;
  completedAt: string;
  packages: EvidencePackage[];
  rejectedCount: number;
  conflictCount: number;
};

export type EvidenceHistoryEntry = {
  packageId: string;
  candidateId: string;
  version: number;
  action: "created" | "updated" | "rejected";
  timestamp: string;
  conflictCount: number;
  coverageAverage: number;
};

export type EvidenceMetricsSnapshot = {
  packagesCreated: number;
  packagesUpdated: number;
  packagesRejected: number;
  conflictsDetected: number;
  candidatesProcessed: number;
  averageCoverage: number;
  lastRunAt: string | null;
};

export type EvidenceExplorerSnapshot = {
  packages: EvidencePackage[];
  history: EvidenceHistoryEntry[];
  metrics: EvidenceMetricsSnapshot;
  lastRunAt: string | null;
  connectorRunId: string | null;
};
