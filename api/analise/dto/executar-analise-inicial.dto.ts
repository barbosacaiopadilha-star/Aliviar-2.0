export interface ExecutarAnaliseInicialRequest {
  observacoes: string;
  contexto?: string;
}

export interface ExecutarAnaliseInicialResponse {
  analise_id: string;
  jornada_id: string;
  executada_em: string;
  executada_por: string;
}
