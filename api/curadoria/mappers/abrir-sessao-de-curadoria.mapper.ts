import type { AbrirSessaoDeCuradoriaCommand } from "@/application/curadoria/abrir-sessao-de-curadoria";
import type { AbrirSessaoDeCuradoriaOutput } from "@/application/curadoria/abrir-sessao-de-curadoria.output";
import type { AbrirSessaoDeCuradoriaResponse } from "../dto/abrir-sessao-de-curadoria.dto";

export function toAbrirSessaoDeCuradoriaCommand(
  jornadaId: string,
): AbrirSessaoDeCuradoriaCommand {
  return { jornadaId };
}

export function toAbrirSessaoDeCuradoriaResponse(
  output: AbrirSessaoDeCuradoriaOutput,
): AbrirSessaoDeCuradoriaResponse {
  return {
    sessao_id: output.sessaoId,
    jornada_id: output.jornadaId,
    curador_id: output.curadorId,
    status: output.status,
    aberta_em: output.abertaEm,
  };
}
