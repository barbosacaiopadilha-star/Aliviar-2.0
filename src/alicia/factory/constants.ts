export const FACTORY_VERSION = "2.0.0";

export const FACTORY_STAGES = [
  "discovery",
  "evidence",
  "protocol",
  "publication",
  "verification",
  "operations",
] as const;

export const SCHEDULE_INTERVALS_MS: Record<string, number> = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  ON_DEMAND: 0,
  MANUAL: 0,
};

export const STAGE_EVENT_COMPLETION: Record<
  (typeof FACTORY_STAGES)[number],
  readonly string[]
> = {
  discovery: ["DiscoveryCompleted"],
  evidence: ["EvidenceCollected", "EvidencePackageCreated"],
  protocol: ["ProtocolEvaluated"],
  publication: ["PublicationSucceeded", "PublicationFailed"],
  verification: ["VerificationCompleted", "VerificationFailed"],
  operations: ["FactoryCheckpoint"],
};
