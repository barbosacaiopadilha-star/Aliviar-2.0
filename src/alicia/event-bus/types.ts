export type DomainEventType =
  | "DiscoveryCompleted"
  | "CandidateQueued"
  | "EvidenceRequested"
  | "EvidenceCollected"
  | "EvidenceFailed"
  | "ProtocolStarted"
  | "ProtocolEvaluated"
  | "PublicationRequested"
  | "PublicationStarted"
  | "PublicationSucceeded"
  | "PublicationFailed"
  | "PublicationRolledBack"
  | "ReviewCaseCreated"
  | "ReviewCaseResolved"
  | "VerificationRequested"
  | "VerificationStarted"
  | "VerificationCompleted"
  | "VerificationFailed"
  | "ProfileChanged"
  | "ReviewRequested"
  | "EvidencePackageCreated"
  | "EvidenceConflictDetected"
  | "EvidencePackageUpdated"
  | "EvidencePackageRejected"
  | "FactoryStarted"
  | "FactoryFinished"
  | "FactoryFailed"
  | "FactoryCheckpoint"
  | "FactoryResumed"
  | "FactoryDryRun";

export type RetryStatus =
  | "Pending"
  | "Processing"
  | "Succeeded"
  | "Failed"
  | "Retrying"
  | "DeadLetter";

export type DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  payload: TPayload;
  timestamp: string;
  correlationId: string;
  causationId: string | null;
  source: string;
  version: number;
};

export type StoredEvent = DomainEvent;

export type EventHandler<TPayload extends Record<string, unknown> = Record<string, unknown>> = (
  event: DomainEvent<TPayload>,
) => void | Promise<void>;

export type RetryableJob = {
  jobId: string;
  event: DomainEvent;
  handlerName: string;
  status: RetryStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeadLetterItem = {
  id: string;
  job: RetryableJob;
  movedAt: string;
  reason: string;
};

export type EventBusMetricsSnapshot = {
  eventsPublished: number;
  eventsProcessed: number;
  handlerFailures: number;
  averageProcessingMs: number;
  listenerCount: number;
  retryCount: number;
  dlqCount: number;
  eventsByType: Record<string, number>;
};

export type WorkflowTimelineEntry = {
  event: StoredEvent;
  retryStatus?: RetryStatus;
  inDlq: boolean;
};

export type WorkflowMonitorSnapshot = {
  correlationId: string;
  timeline: WorkflowTimelineEntry[];
  metrics: EventBusMetricsSnapshot;
  dlq: DeadLetterItem[];
  pendingRetries: RetryableJob[];
};
