export type DiscoveryCandidateStatus =
  | "DISCOVERED"
  | "NORMALIZED"
  | "DUPLICATE"
  | "QUEUED"
  | "IGNORED";

export type DiscoveryQueueStatus =
  | "DISCOVERED"
  | "READY_FOR_EVIDENCE"
  | "IGNORED"
  | "DUPLICATE";

export type SourceHealthStatus = "ONLINE" | "DEGRADED" | "OFFLINE" | "UNKNOWN";

export type RawDiscoveryRecord = {
  nome: string;
  crm?: string;
  crmUf?: string;
  especialidade: string;
  cidade: string;
  estado: string;
  urlOrigem?: string;
  telefone?: string;
  confidence?: number;
};

export type DiscoverySourceResult = {
  records: RawDiscoveryRecord[];
  error?: string;
};

export type DiscoveryCandidate = {
  candidateId: string;
  nome: string;
  crm: string;
  crmUf: string;
  especialidade: string;
  cidade: string;
  estado: string;
  fonteOrigem: string;
  fontesEncontradas: string[];
  urlOrigem: string;
  dataDescoberta: string;
  confidence: number;
  hashIdentidade: string;
  status: DiscoveryCandidateStatus;
  telefone?: string;
};

export type DiscoveryQueueItem = {
  queueId: string;
  candidate: DiscoveryCandidate;
  status: DiscoveryQueueStatus;
  enqueuedAt: string;
  duplicateOf?: string;
};

export type DiscoveryAuditEvent = {
  id: string;
  at: string;
  sourceId: string;
  sourceName: string;
  foundCount: number;
  normalizedCount: number;
  duplicateCount: number;
  failed: boolean;
  error?: string;
  durationMs: number;
};

export type DiscoveryMetricsSnapshot = {
  candidatesFound: number;
  duplicates: number;
  ignored: number;
  queued: number;
  readyForEvidence: number;
  sourcesExecuted: number;
  sourceFailures: number;
  averageDurationMs: number;
  lastRunAt: string | null;
};

export type DiscoveryRunResult = {
  runId: string;
  startedAt: string;
  completedAt: string;
  candidates: DiscoveryCandidate[];
  queueItems: DiscoveryQueueItem[];
  metrics: DiscoveryMetricsSnapshot;
  sourceHealth: Record<string, SourceHealthStatus>;
};
