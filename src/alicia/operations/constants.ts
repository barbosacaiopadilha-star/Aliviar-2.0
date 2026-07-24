export const OPERATIONS_VERSION = "1.0.0";

export const PIPELINE_STAGES = [
  "discovery",
  "evidence",
  "protocol",
  "publication",
  "verification",
] as const;

export const BOTTLENECK_THRESHOLDS = {
  slowStageLatencyMs: 5_000,
  queueGrowthRatio: 1.5,
  retryStormCount: 5,
  dlqGrowthCount: 3,
  abnormalLatencyMultiplier: 2,
  reviewSpikeRatio: 2,
  connectorDegradedAvailability: 0.8,
} as const;

export const STAGE_EVENT_MAP = {
  discovery: ["DiscoveryCompleted", "CandidateQueued"],
  evidence: [
    "EvidenceRequested",
    "EvidenceCollected",
    "EvidenceFailed",
    "EvidencePackageCreated",
    "EvidencePackageUpdated",
    "EvidencePackageRejected",
  ],
  protocol: ["ProtocolStarted", "ProtocolEvaluated", "ReviewCaseCreated"],
  publication: [
    "PublicationRequested",
    "PublicationStarted",
    "PublicationSucceeded",
    "PublicationFailed",
    "PublicationRolledBack",
  ],
  verification: [
    "VerificationRequested",
    "VerificationStarted",
    "VerificationCompleted",
    "VerificationFailed",
    "ProfileChanged",
    "ReviewRequested",
  ],
} as const;
