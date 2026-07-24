export {
  createCrmEstadualConnector,
  createCrmEstadualConnectorWithMetrics,
  getCrmEstadualAdapterMetrics,
} from "./crm-estadual-connector";
export {
  buildCrmConfigReport,
  runCrmHomologationProbe,
  compareCrmDiscovery,
  formatCrmHomologationMarkdown,
  classifyCrmHomologation,
} from "./homologation";
export type { CrmEstadualConnectorOptions } from "./crm-estadual-connector";
export { CfmSoapClient, buildConsultarEnvelope, parseConsultarResponse } from "./cfm-soap-client";
export type { CfmSoapClientOptions, CfmSoapTransport } from "./cfm-soap-client";
export { loadCrmEstadualConfig, isCrmEstadualConfigured } from "./config";
export { CrmEstadualAdapterMetrics } from "./metrics";
export type {
  CfmCrmRawRecord,
  CfmConsultaRequest,
  CfmConsultaResponse,
  CrmEstadualAdapterConfig,
  CrmEstadualAdapterMetricsSnapshot,
} from "./types";
