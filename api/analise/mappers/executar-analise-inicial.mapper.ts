import type { ExecutarAnaliseInicialCommand } from "@/application/analise/executar-analise-inicial";
import type { ExecutarAnaliseInicialOutput } from "@/application/analise/executar-analise-inicial.output";
import type {
  ExecutarAnaliseInicialRequest,
  ExecutarAnaliseInicialResponse,
} from "../dto/executar-analise-inicial.dto";

export function toExecutarAnaliseInicialCommand(
  jornadaId: string,
  request: ExecutarAnaliseInicialRequest,
): ExecutarAnaliseInicialCommand {
  return {
    jornadaId,
    observacoes: request.observacoes,
    contexto: request.contexto ?? null,
  };
}

export function toExecutarAnaliseInicialResponse(
  output: ExecutarAnaliseInicialOutput,
): ExecutarAnaliseInicialResponse {
  return {
    analise_id: output.analiseId,
    jornada_id: output.jornadaId,
    executada_em: output.executadaEm,
    executada_por: output.executadaPor,
  };
}
