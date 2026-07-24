export type FactoryEventType =
  | "FactoryStarted"
  | "FactoryFinished"
  | "FactoryFailed"
  | "FactoryCheckpoint"
  | "FactoryResumed"
  | "FactoryDryRun";

export type FactoryStartedPayload = {
  runId: string;
  schedule: string;
  dryRun: boolean;
  correlationId: string;
};

export type FactoryFinishedPayload = {
  runId: string;
  durationMs: number;
  candidatesFound: number;
  evidencePackages: number;
  published: number;
  reviewCases: number;
  dryRun: boolean;
};

export type FactoryFailedPayload = {
  runId: string;
  reason: string;
  stage?: string;
};

export type FactoryCheckpointPayload = {
  runId: string;
  stage: string;
  completedAt: string;
  candidateCount: number;
};

export type FactoryResumedPayload = {
  runId: string;
  fromStage: string;
};

export type FactoryDryRunPayload = {
  runId: string;
  wouldPublish: number;
  skippedPublication: boolean;
};
