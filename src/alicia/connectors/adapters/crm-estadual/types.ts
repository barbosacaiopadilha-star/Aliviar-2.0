export type CfmCrmRawRecord = {
  crm: string;
  uf: string;
  nome: string;
  situacao: string;
  tipoInscricao?: string;
  especialidades: string[];
  fetchedAt: string;
  sourceUrl: string;
};

export type CfmConsultaRequest = {
  crm: string;
  uf: string;
  chave: string;
};

export type CfmConsultaResponse = {
  crm: string;
  uf: string;
  nome: string;
  situacao: string;
  tipoInscricao?: string;
  especialidades: string[];
};

export type CrmEstadualAdapterConfig = {
  uf: string;
  apiKey: string | null;
  seedCrms: string[];
  serviceUrl: string;
  enabled: boolean;
  requestTimeoutMs: number;
};

export type CrmEstadualAdapterMetricsSnapshot = {
  requests: number;
  successes: number;
  failures: number;
  notFound: number;
  degradedEvents: number;
  averageLatencyMs: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  configured: boolean;
};
