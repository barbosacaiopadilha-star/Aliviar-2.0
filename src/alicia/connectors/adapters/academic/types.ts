export type AcademicEvidenceKind = "graduation" | "residency" | "fellowship";

/** Saída canônica de um adapter acadêmico. */
export type AcademicEvidenceOutput = {
  institution: string;
  program?: string;
  degree?: string;
  startYear?: string;
  endYear?: string;
  source: string;
  confidence: number;
};

/** Registro bruto retornado por fetch de um adapter acadêmico mockado/real. */
export type AcademicRawRecord = {
  nome: string;
  crm?: string;
  crm_uf?: string;
  especialidade?: string;
  cidade?: string;
  estado?: string;
  institution: string;
  program?: string;
  degree?: string;
  startYear?: string;
  endYear?: string;
  source: string;
  confidence?: number;
};

/** Configuração para integração real futura. */
export type AcademicAdapterConfig = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
};
