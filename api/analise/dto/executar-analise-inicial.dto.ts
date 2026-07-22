export interface ExecutarAnaliseInicialRequest {
  observacoes: string;
  contexto?: string;
}

export interface ExecutarAnaliseInicialResponse {
  analise_id: string;
  execution_id: string;
  jornada_id: string;
  executada_em: string;
  executada_por: string;
  ace_version: string;
  correlation_id: string;
  status: string;
  duration_ms: number;
}
