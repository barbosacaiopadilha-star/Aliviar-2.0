export interface AnaliseInicial {
  analiseId: string;
  executionId: string;
  jornadaId: string;
  observacoes: string;
  contexto: string | null;
  executadaEm: string;
  executadaPor: string;
  aceVersion: string;
  correlationId: string;
  status: string;
  durationMs: number;
}
