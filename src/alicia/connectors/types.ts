import type { ConnectorEventType } from "./connector-events";

export type ConnectorHealthStatus =
  | "ONLINE"
  | "DEGRADED"
  | "OFFLINE"
  | "MAINTENANCE"
  | "UNKNOWN";

export type ConnectorSourceType =
  | "crm-estadual"
  | "cfm"
  | "hospital"
  | "universidade"
  | "sociedade-medica"
  | "site-institucional"
  | "academic-graduation"
  | "academic-residency"
  | "academic-fellowship";

export type AcademicEvidenceKind = "graduation" | "residency" | "fellowship";

export type AcademicEvidenceRecord = {
  kind: AcademicEvidenceKind;
  institution: string;
  program?: string;
  degree?: string;
  startYear?: string;
  endYear?: string;
  source: string;
  confidence: number;
};

export type RateLimitConfig = {
  perMinute: number;
  perHour: number;
  maxRetries: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
};

export type ConnectorAuthResult = {
  success: boolean;
  token?: string;
  error?: string;
  authenticatedAt: string;
};

export type ConnectorFetchResult<T = unknown> = {
  success: boolean;
  data: T[];
  error?: string;
  fetchedAt: string;
  latencyMs: number;
};

export type NormalizedConnectorRecord = {
  recordId: string;
  sourceId: string;
  sourceType: ConnectorSourceType;
  nome: string;
  crm: string;
  crmUf: string;
  especialidade: string;
  cidade: string;
  estado: string;
  urlOrigem: string;
  telefone?: string;
  confidence: number;
  fetchedAt: string;
  academicEvidence?: AcademicEvidenceRecord[];
};

export type ValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type ConnectorExecutionStatus =
  | "IDLE"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "DISABLED";

export type ConnectorStatusSnapshot = {
  connectorId: string;
  name: string;
  version: string;
  enabled: boolean;
  priority: number;
  health: ConnectorHealthStatus;
  executionStatus: ConnectorExecutionStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  availability: number;
  averageLatencyMs: number;
  failureRate: number;
};

export type ConnectorHealthSnapshot = {
  connectorId: string;
  status: ConnectorHealthStatus;
  lastExecutionAt: string | null;
  averageLatencyMs: number;
  failureRate: number;
  availability: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
};

export type ConnectorMetricsSnapshot = {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  retries: number;
  averageLatencyMs: number;
  throughputPerMinute: number;
  availability: number;
  byConnector: Record<
    string,
    {
      executions: number;
      successes: number;
      failures: number;
      retries: number;
      averageLatencyMs: number;
      availability: number;
    }
  >;
};

export type ConnectorRetryJob = {
  jobId: string;
  connectorId: string;
  attempt: number;
  maxAttempts: number;
  status: "Pending" | "Retrying" | "Succeeded" | "Failed";
  lastError: string | null;
  scheduledAt: string;
  updatedAt: string;
};

export type ConnectorEvent = {
  eventId: string;
  eventType: ConnectorEventType;
  connectorId: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type ConnectorEventHandler = (event: ConnectorEvent) => void | Promise<void>;

export type ConnectorRunResult = {
  connectorId: string;
  success: boolean;
  records: NormalizedConnectorRecord[];
  invalidCount: number;
  error?: string;
  latencyMs: number;
  retries: number;
};

export type ConnectorManagerRunResult = {
  runId: string;
  startedAt: string;
  completedAt: string;
  results: ConnectorRunResult[];
  metrics: ConnectorMetricsSnapshot;
};

export type ConnectorMonitorSnapshot = {
  connectors: ConnectorStatusSnapshot[];
  metrics: ConnectorMetricsSnapshot;
  health: ConnectorHealthSnapshot[];
  retryQueue: ConnectorRetryJob[];
  recentEvents: ConnectorEvent[];
  lastRunAt: string | null;
};
