export const ACE_MELHORADO_VERSION = "2.0.0" as const;

export type AceAnalysisStatus = "INICIADO" | "CONCLUIDO" | "PARCIAL" | "FALHA";

export type AceTriggerSource = "UPLOAD" | "STAFF" | "SISTEMA";

export interface AceDocumentoAnalisado {
  id: string;
  nome: string;
  status: string;
}

export interface AceStructuredResult {
  versao: typeof ACE_MELHORADO_VERSION;
  status: Exclude<AceAnalysisStatus, "INICIADO">;
  documentos_analisados: AceDocumentoAnalisado[];
  contexto_operacional: string;
  lacunas_informacao: string[];
  pontos_atencao_operacional: string[];
  proximos_passos_sugeridos: string[];
  resumo_para_curador: string;
}

export interface AceAnalysisRunView {
  id: string;
  /** Identificador único da execução ACE (mesmo valor que `id`). */
  execution_id: string;
  jornada_id: string;
  ace_version: string;
  status: AceAnalysisStatus;
  duration_ms: number;
  correlation_id: string;
  retries: number;
  triggered_by: AceTriggerSource;
  iniciado_em: string;
  concluido_em: string | null;
  resultado: AceStructuredResult | null;
}

export interface AceAnaliseCuradorView {
  run_id: string;
  execution_id: string;
  versao: string;
  status: AceAnalysisStatus;
  resumo_para_curador: string;
  lacunas_informacao: string[];
  pontos_atencao_operacional: string[];
  proximos_passos_sugeridos: string[];
  documentos_analisados: AceDocumentoAnalisado[];
  atualizado_em: string;
}

export interface AceInputPayload {
  etapa_atual: string;
  documentos_count: number;
  observacoes_staff?: string | null;
  contexto_staff?: string | null;
  trigger: AceTriggerSource;
}
