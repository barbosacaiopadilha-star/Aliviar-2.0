import type { EvidenceCategory } from "./constants";

export type CategoryEvidenceItem = {
  category: EvidenceCategory;
  fields: string[];
  sources: string[];
  coveragePercent: number;
};

export type ConflictingEvidenceItem = {
  category: EvidenceCategory;
  field: string;
  conflictType: string;
  values: Array<{ value: string; sources: string[] }>;
};

export type CandidateCoverageAnalysis = {
  candidateId: string;
  name: string;
  specialty: string;
  city: string;
  coveragePercent: number;
  existing: CategoryEvidenceItem[];
  missing: CategoryEvidenceItem[];
  conflicting: ConflictingEvidenceItem[];
};

export type MissingEvidenceByCategory = {
  category: EvidenceCategory;
  candidateCount: number;
  candidateIds: string[];
  missingFields: string[];
};

export type MissingEvidenceReport = {
  generatedAt: string;
  byCategory: MissingEvidenceByCategory[];
  totalCandidates: number;
};

export type AcquisitionPlanEntry = {
  candidateId: string;
  candidateName: string;
  category: EvidenceCategory;
  missingFields: string[];
  suggestedConnectors: string[];
};

export type AcquisitionPlan = {
  generatedAt: string;
  entries: AcquisitionPlanEntry[];
};

export type CoverageKpis = {
  averageCoverage: number;
  byCategory: Record<EvidenceCategory, number>;
  byConnector: Record<string, number>;
  bySpecialty: Record<string, number>;
  byCandidate: Record<string, number>;
  oneEvidenceAwayCount: number;
};

export type PrioritizedCandidate = {
  rank: number;
  candidateId: string;
  name: string;
  specialty: string;
  city: string;
  coveragePercent: number;
  missingCount: number;
  conflictCount: number;
  priorityScore: number;
  oneEvidenceAway: boolean;
  suggestedConnectors: string[];
};

export type ConnectorImpactEstimate = {
  connectorId: string;
  missingCategoriesAddressable: number;
  candidatesHelped: number;
  estimatedCoverageIncrease: number;
};

export type EvidenceCoverageSnapshot = {
  generatedAt: string;
  analyses: CandidateCoverageAnalysis[];
  missingReport: MissingEvidenceReport;
  acquisitionPlan: AcquisitionPlan;
  kpis: CoverageKpis;
  prioritized: PrioritizedCandidate[];
  connectorImpact: ConnectorImpactEstimate[];
};

export type EvidenceCoverageReport = {
  generatedAt: string;
  kpis: CoverageKpis;
  missingReport: MissingEvidenceReport;
  connectorImpact: ConnectorImpactEstimate[];
  prioritized: PrioritizedCandidate[];
  oneEvidenceAwayCount: number;
};
