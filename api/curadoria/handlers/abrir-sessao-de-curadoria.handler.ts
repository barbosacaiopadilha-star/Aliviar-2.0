import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import {
  toAbrirSessaoDeCuradoriaCommand,
  toAbrirSessaoDeCuradoriaResponse,
} from "../mappers/abrir-sessao-de-curadoria.mapper";

export async function handleAbrirSessaoDeCuradoria(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  if (!jornadaId) {
    const mapped = mapValidationToApiResponse("jornada_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const command = toAbrirSessaoDeCuradoriaCommand(jornadaId);

  return handleApplicationResult(
    toApplicationResult(app.abrirSessaoDeCuradoria.execute(command)),
    toAbrirSessaoDeCuradoriaResponse,
    201,
  );
}
