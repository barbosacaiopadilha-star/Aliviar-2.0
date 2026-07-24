export type CrmConfigCheck = {
  variable: string;
  present: boolean;
  valid: boolean;
  maskedValue: string;
  message: string;
};

export type CrmConfigReport = {
  generatedAt: string;
  configured: boolean;
  readyForProbe: boolean;
  checks: CrmConfigCheck[];
  uf: string;
  seedCount: number;
  serviceUrl: string;
  enabled: boolean;
  requestTimeoutMs: number;
};

export type CrmProbeErrorKind =
  | "auth"
  | "soap_fault"
  | "timeout"
  | "http_error"
  | "not_found"
  | "network"
  | "config"
  | "unknown";

export type CrmProbeAttempt = {
  crm: string;
  success: boolean;
  latencyMs: number;
  errorKind?: CrmProbeErrorKind;
  errorMessage?: string;
  recordName?: string;
  retries: number;
};

export type CrmHomologationProbeResult = {
  startedAt: string;
  completedAt: string;
  configured: boolean;
  attempts: CrmProbeAttempt[];
  averageLatencyMs: number;
  successRate: number;
  availability: number;
  soapErrors: number;
  timeouts: number;
  retries: number;
  health: "ONLINE" | "DEGRADED" | "OFFLINE";
};

export type CrmDiscoveryCandidateSummary = {
  candidateId: string;
  nome: string;
  crm: string;
  especialidade: string;
  cidade: string;
  confidence: number;
};

export type CrmDiscoveryComparison = {
  mock: {
    candidatesFound: number;
    unique: number;
    duplicates: number;
    ignored: number;
    candidates: CrmDiscoveryCandidateSummary[];
  };
  real: {
    candidatesFound: number;
    unique: number;
    duplicates: number;
    ignored: number;
    candidates: CrmDiscoveryCandidateSummary[];
    fetchSuccess: boolean;
    error?: string;
  };
  onlyInMock: string[];
  onlyInReal: string[];
  inBoth: string[];
  inconsistencies: Array<{ crm: string; field: string; mock: string; real: string }>;
};

export type CrmPipelineImpact = {
  coverageAverage: number;
  coverageDeltaVsBaseline: number;
  humanReview: number;
  humanReviewDelta: number;
  autoPublish: number;
  autoPublishDelta: number;
  publicationDryRun: number;
  verificationAttempted: number;
  operationsBottlenecks: number;
};

export type CrmHomologationClassification = "READY_FOR_PRODUCTION" | "NEEDS_IMPROVEMENT";

export type CrmEsHomologationReport = {
  generatedAt: string;
  mission: "010";
  config: CrmConfigReport;
  probe: CrmHomologationProbeResult;
  discovery: CrmDiscoveryComparison;
  pipeline: CrmPipelineImpact;
  problems: string[];
  classification: CrmHomologationClassification;
  classificationReason: string;
  baseline: {
    coverageAverage: number;
    humanReview: number;
    autoPublish: number;
    source: string;
  };
};
