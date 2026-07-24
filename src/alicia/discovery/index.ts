export { DISCOVERY_ENGINE_VERSION, SCOPED_SPECIALTIES, SCOPED_STATE } from "./constants";
export { buildIdentityHash, buildCandidateId } from "./identity-hash";
export {
  normalizeName,
  normalizeCrm,
  normalizeUf,
  normalizeSpecialty,
  normalizeCity,
  normalizeUrl,
  normalizePhone,
  extractCrmParts,
} from "./normalizer";
export {
  normalizeDiscoveryRecord,
  deduplicateCandidates,
  markQueued,
} from "./deduplicator";
export { DiscoveryQueue, globalDiscoveryQueue } from "./discovery-queue";
export { DiscoveryMetrics, globalDiscoveryMetrics } from "./metrics";
export { DiscoveryAuditTrail, globalDiscoveryAuditTrail } from "./audit";
export { DiscoveryEngine, runDiscovery } from "./discovery-engine";
export {
  defaultDiscoverySources,
  cfmDiscoverySource,
  crmEstadualDiscoverySource,
  hospitalDiscoverySource,
  universidadeDiscoverySource,
  sociedadeMedicaDiscoverySource,
  siteInstitucionalDiscoverySource,
  createFailingDiscoverySource,
} from "./sources/mock-sources";
export { getDiscoveryInboxSnapshot, resetDiscoverySession } from "./studio-adapter";
export type { DiscoverySource } from "./ports/discovery-source";
export type {
  DiscoveryCandidate,
  DiscoveryCandidateStatus,
  DiscoveryQueueItem,
  DiscoveryQueueStatus,
  DiscoveryAuditEvent,
  DiscoveryMetricsSnapshot,
  DiscoveryRunResult,
  RawDiscoveryRecord,
  SourceHealthStatus,
} from "./types";
