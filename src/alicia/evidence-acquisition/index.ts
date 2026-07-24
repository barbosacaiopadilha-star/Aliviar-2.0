export { EVIDENCE_ACQUISITION_VERSION, NORMALIZATION_VERSION, COVERAGE_SECTIONS, SECTION_FIELD_MAP } from "./constants";
export { EvidenceAcquisitionEngine } from "./evidence-acquisition-engine";
export type { EvidenceAcquisitionEngineOptions } from "./evidence-acquisition-engine";
export { EvidenceCollector, buildCandidateKey, buildCandidateIdFromRecord } from "./evidence-collector";
export { EvidenceNormalizer } from "./evidence-normalizer";
export type { NormalizedRecordFields } from "./evidence-normalizer";
export { EvidenceMerger } from "./evidence-merger";
export { createProvenance, collectUniqueSources, mergeProvenanceLists } from "./evidence-provenance";
export { ConflictDetector } from "./conflict-detector";
export { EvidencePackageBuilder } from "./evidence-package-builder";
export { EvidenceScoreCalculator } from "./evidence-score";
export { EvidenceHistory } from "./evidence-history";
export { EvidenceMetrics } from "./evidence-metrics";
export { hashRawRecord, buildPackageId, buildConflictId } from "./hash";
export { EvidenceBusBridge } from "./integration/evidence-bus-bridge";
export type { EvidenceBusBridgeOptions } from "./integration/evidence-bus-bridge";
export {
  getEvidenceExplorerSnapshot,
  resetEvidenceSession,
} from "./studio-adapter";
export type {
  EvidenceAcquisitionEventType,
  EvidencePackageCreatedPayload,
  EvidenceConflictDetectedPayload,
  EvidencePackageUpdatedPayload,
  EvidencePackageRejectedPayload,
} from "./evidence-acquisition-events";
export type {
  EvidenceProvenance,
  MergedEvidenceValue,
  NormalizedEvidenceField,
  NormalizedCandidateEvidence,
  EvidenceConflictType,
  EvidenceConflict,
  EvidenceItem,
  CoverageScore,
  CoverageSection,
  EvidencePackageIdentity,
  EvidencePackageRegistration,
  EvidencePackageEducation,
  EvidencePackageResidency,
  EvidencePackageFellowship,
  EvidencePackageInstitution,
  EvidencePackageSpecialty,
  EvidencePackagePracticeLocation,
  EvidencePackageMetadata,
  EvidencePackage,
  ConnectorEvidenceInput,
  CollectedRecord,
  CollectorResult,
  AcquisitionRunResult,
  EvidenceHistoryEntry,
  EvidenceMetricsSnapshot,
  EvidenceExplorerSnapshot,
} from "./types";
