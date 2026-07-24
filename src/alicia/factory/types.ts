import type { FACTORY_STAGES } from "./constants";

export type FactorySchedule =
  | "MANUAL"
  | "HOURLY"
  | "DAILY"
  | "WEEKLY"
  | "ON_DEMAND";

export type FactoryRunStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED"
  | "DRY_RUN";

export type FactoryCheckpointStage = (typeof FACTORY_STAGES)[number];

export type FactoryCheckpoint = {
  stage: FactoryCheckpointStage;
  completedAt: string;
  candidateIds: string[];
  metadata?: Record<string, string | number | boolean>;
};

export type FactoryRun = {
  runId: string;
  schedule: FactorySchedule;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  status: FactoryRunStatus;
  dryRun: boolean;
  candidatesFound: number;
  evidencePackages: number;
  published: number;
  reviewCases: number;
  errors: string[];
  warnings: string[];
  checkpoints: FactoryCheckpoint[];
  correlationId: string;
};

export type FactoryRunReport = {
  runId: string;
  generatedAt: string;
  durationMs: number;
  dryRun: boolean;
  kpis: {
    candidatesFound: number;
    evidencePackages: number;
    published: number;
    reviewCases: number;
    failures: number;
    warnings: number;
  };
  latencies: {
    totalMs: number;
    byStage: Record<FactoryCheckpointStage, number>;
  };
  reviewRate: number;
  publicationRate: number;
  connectorHealth: number;
  bottlenecks: string[];
  failures: Array<{ candidateId: string; error: string; stage: string }>;
  warnings: string[];
};

export type FactoryMetricsSnapshot = {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  dryRuns: number;
  averageDurationMs: number;
  profilesPublished: number;
  reviewCases: number;
  failures: number;
  retries: number;
  rollbacks: number;
  verifications: number;
  lastRunAt: string | null;
};

export type FactoryCenterSnapshot = {
  runs: FactoryRun[];
  metrics: FactoryMetricsSnapshot;
  lastRun: FactoryRun | null;
  lastReport: FactoryRunReport | null;
  scheduler: {
    schedule: FactorySchedule;
    nextRunAt: string | null;
    due: boolean;
  };
};
