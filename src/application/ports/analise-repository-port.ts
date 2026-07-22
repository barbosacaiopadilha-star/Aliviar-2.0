import type { AnaliseInicial } from "@/domain/analise/analise-inicial";

export interface ExecutarAnaliseInicialInput {
  jornadaId: string;
  observacoes: string;
  contexto?: string | null;
}

export interface AnaliseRepositoryPort {
  executarAnaliseInicial(
    input: ExecutarAnaliseInicialInput,
    executadaPor: string,
  ): Promise<AnaliseInicial>;
}
