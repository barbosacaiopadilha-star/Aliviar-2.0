export { buildCrmConfigReport } from "./config-report";
export { runCrmHomologationProbe } from "./homologation-probe";
export { compareCrmDiscovery, runMockCrmDiscovery, runRealCrmDiscovery } from "./discovery-bridge";
export {
  classifyCrmHomologation,
  buildProblemsList,
  formatCrmHomologationMarkdown,
} from "./report-formatter";
export type {
  CrmConfigReport,
  CrmConfigCheck,
  CrmHomologationProbeResult,
  CrmProbeAttempt,
  CrmDiscoveryComparison,
  CrmEsHomologationReport,
  CrmHomologationClassification,
  CrmPipelineImpact,
} from "./types";
