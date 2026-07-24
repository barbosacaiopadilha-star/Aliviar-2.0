export { EVIDENCE_COVERAGE_VERSION, EVIDENCE_CATEGORIES, CATEGORY_CONNECTOR_HINTS } from "./constants";
export { CoverageAnalyzer } from "./coverage-analyzer";
export { MissingEvidenceReportBuilder } from "./missing-evidence-report";
export { AcquisitionPlanner } from "./acquisition-planner";
export { CoverageKpiCalculator } from "./coverage-kpis";
export { CandidatePrioritizer } from "./candidate-prioritizer";
export {
  EvidenceCoverageEngine,
  ConnectorImpactEstimator,
  buildEvidenceCoverageReport,
  formatEvidenceCoverageReportMarkdown,
} from "./evidence-coverage-engine";
export {
  getEvidenceCoverageSnapshot,
  resetEvidenceCoverageSession,
} from "./studio-adapter";
export type {
  CandidateCoverageAnalysis,
  MissingEvidenceReport,
  AcquisitionPlan,
  CoverageKpis,
  PrioritizedCandidate,
  ConnectorImpactEstimate,
  EvidenceCoverageSnapshot,
  EvidenceCoverageReport,
} from "./types";
export type { EvidenceCategory } from "./constants";
