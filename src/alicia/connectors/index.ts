export { CONNECTOR_FRAMEWORK_VERSION } from "./constants";
export type { SourceConnector } from "./ports/source-connector";
export { ConnectorRegistry } from "./connector-registry";
export { ConnectorManager } from "./connector-manager";
export type { ConnectorManagerOptions } from "./connector-manager";
export { HealthMonitor } from "./health-monitor";
export { RateLimiter } from "./rate-limiter";
export { NormalizerPipeline } from "./normalizer-pipeline";
export type { NormalizerPipelineResult } from "./normalizer-pipeline";
export { validateNormalizedRecord, validateSchema } from "./validation-layer";
export { ConnectorMetrics } from "./connector-metrics";
export { ConnectorEventEmitter } from "./connector-event-emitter";
export {
  getConnectorMonitorSnapshot,
  resetConnectorSession,
} from "./studio-adapter";
export { defaultConnectors, createDefaultConnectors } from "./default-connectors";
export {
  OfficialSourceRegistry,
  defaultOfficialSourceRegistry,
  formatOfficialSourceRoadmapMarkdown,
  computeImpactRanking,
  OFFICIAL_SOURCE_SEED,
} from "./official-sources";
export type {
  OfficialSourceRecord,
  OfficialSourceRegistrySnapshot,
  OfficialSourceImpactRanking,
  HomologationStage,
} from "./official-sources";
export {
  createCrmEstadualConnector,
  createCrmEstadualConnectorWithMetrics,
  getCrmEstadualAdapterMetrics,
  CfmSoapClient,
  loadCrmEstadualConfig,
  isCrmEstadualConfigured,
  CrmEstadualAdapterMetrics,
} from "./adapters/crm-estadual";
export {
  academicGraduationConnector,
  academicResidencyConnector,
  academicFellowshipConnector,
  defaultAcademicConnectors,
  createAcademicMockConnector,
} from "./adapters/academic";
export type {
  AcademicEvidenceKind,
  AcademicEvidenceOutput,
  AcademicRawRecord,
  AcademicAdapterConfig,
} from "./adapters/academic/types";
export type { AcademicEvidenceConnector } from "./adapters/academic/academic-connector-port";
export {
  defaultMockConnectors,
  crmEstadualMockConnector,
  cfmConnector,
  hospitalConnector,
  universidadeConnector,
  sociedadeMedicaConnector,
  siteInstitucionalConnector,
  createFailingMockConnector,
} from "./mocks";
export { createMockConnector, resetMockConnectorAttempts } from "./mocks/mock-connector-factory";
export type { MockConnectorOptions } from "./mocks/mock-connector-factory";
export type { MockRawRecord } from "./mocks/mock-data";
export type {
  ConnectorEventType,
  ConnectorStartedPayload,
  ConnectorSucceededPayload,
  ConnectorFailedPayload,
  ConnectorRetriedPayload,
  ConnectorDisabledPayload,
  ConnectorRecoveredPayload,
} from "./connector-events";
export type {
  ConnectorHealthStatus,
  ConnectorSourceType,
  AcademicEvidenceRecord,
  RateLimitConfig,
  ConnectorAuthResult,
  ConnectorFetchResult,
  NormalizedConnectorRecord,
  ValidationIssue,
  ValidationResult,
  ConnectorExecutionStatus,
  ConnectorStatusSnapshot,
  ConnectorHealthSnapshot,
  ConnectorMetricsSnapshot,
  ConnectorRetryJob,
  ConnectorEvent,
  ConnectorEventHandler,
  ConnectorRunResult,
  ConnectorManagerRunResult,
  ConnectorMonitorSnapshot,
} from "./types";
