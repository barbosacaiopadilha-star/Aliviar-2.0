import type { PIPELINE_STAGES } from "./constants";

export type PipelineStageId = (typeof PIPELINE_STAGES)[number];

export type PipelineStageMetrics = {
  stage: PipelineStageId;
  input: number;
  output: number;
  averageLatencyMs: number;
  successRate: number;
  queueSize: number;
  failures: number;
};

export type PipelineAnalyticsSnapshot = {
  stageLatencies: Record<PipelineStageId, number>;
  totalLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputPerHour: number;
  backlog: number;
  reviewRate: number;
  publicationRate: number;
};

export type BottleneckType =
  | "slow_stage"
  | "growing_queue"
  | "degraded_connector"
  | "excessive_retries"
  | "dlq_growing"
  | "abnormal_latency";

export type Bottleneck = {
  id: string;
  type: BottleneckType;
  severity: "low" | "medium" | "high";
  stage?: PipelineStageId;
  message: string;
  detectedAt: string;
  value?: number;
  threshold?: number;
};

export type OperationalKpis = {
  date: string;
  candidatesFound: number;
  evidencePackages: number;
  protocolApproved: number;
  protocolRejected: number;
  reviewCases: number;
  profilesPublished: number;
  profilesUpdated: number;
  profilesReverified: number;
  connectorAvailability: number;
};

export type TimelineEvent = {
  eventType: string;
  timestamp: string;
  aggregateId: string;
  source: string;
};

export type TimelineStage = {
  stage: PipelineStageId;
  events: TimelineEvent[];
  durationMs?: number;
};

export type OperationalTimeline = {
  correlationId: string;
  candidateId?: string;
  stages: TimelineStage[];
  totalDurationMs: number;
  startedAt: string;
  completedAt: string | null;
};

export type AlertType =
  | "connector_offline"
  | "retry_storm"
  | "dlq_growth"
  | "publication_failure"
  | "protocol_failure"
  | "verification_failure"
  | "review_spike";

export type OperationalAlert = {
  id: string;
  type: AlertType;
  severity: "low" | "medium" | "high";
  message: string;
  detectedAt: string;
  stage?: PipelineStageId;
  metadata?: Record<string, string | number>;
};

export type ConnectorHealthSummary = {
  connectorId: string;
  name: string;
  availability: number;
  health: string;
  averageLatencyMs: number;
};

export type DailyOperationsSnapshot = {
  date: string;
  capturedAt: string;
  kpis: OperationalKpis;
  analytics: PipelineAnalyticsSnapshot;
  reviewRate: number;
  publicationRate: number;
  connectorHealth: ConnectorHealthSummary[];
  stageMetrics: PipelineStageMetrics[];
};

export type OperationsHealthSummary = {
  overall: "healthy" | "degraded" | "critical";
  connectorAvailability: number;
  dlqCount: number;
  pendingRetries: number;
  degradedConnectors: number;
  offlineConnectors: number;
};

export type OperationsCenterSnapshot = {
  dashboard: PipelineStageMetrics[];
  analytics: PipelineAnalyticsSnapshot;
  kpis: OperationalKpis;
  timelines: OperationalTimeline[];
  bottlenecks: Bottleneck[];
  alerts: OperationalAlert[];
  health: OperationsHealthSummary;
  history: DailyOperationsSnapshot[];
  lastRefreshedAt: string;
};

export type RawOperationsInput = {
  discovery: {
    metrics: {
      candidatesFound: number;
      readyForEvidence: number;
      averageDurationMs: number;
      sourcesExecuted: number;
      sourceFailures: number;
    };
    queueSize: number;
  };
  evidence: {
    metrics: {
      packagesCreated: number;
      packagesRejected: number;
      candidatesProcessed: number;
      averageCoverage: number;
    };
    packageCount: number;
  };
  connectors: {
    metrics: {
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      retries: number;
      averageLatencyMs: number;
      availability: number;
    };
    connectors: Array<{
      connectorId: string;
      name: string;
      health: string;
      availability: number;
      averageLatencyMs: number;
    }>;
    retryQueueSize: number;
  };
  workflow: {
    metrics: {
      eventsPublished: number;
      retryCount: number;
      dlqCount: number;
      averageProcessingMs: number;
      eventsByType: Record<string, number>;
    };
    dlqCount: number;
    pendingRetries: number;
    events: Array<{
      eventType: string;
      aggregateId: string;
      timestamp: string;
      correlationId: string;
      source: string;
      payload: Record<string, unknown>;
    }>;
  };
  verification: {
    metrics: {
      profilesVerified: number;
      pendingQueue: number;
      averageLatencyMs: number;
      materialChanges: number;
    };
    pendingReviewCount: number;
    failedRuns: number;
    completedRuns: number;
  };
  protocol: {
    auditCount: number;
    approvedCount: number;
    rejectedCount: number;
    reviewCaseCount: number;
  };
  publication: {
    publishedCount: number;
    failedCount: number;
    reviewCaseCount: number;
  };
};
