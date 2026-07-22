import { application } from "@/infrastructure/composition-root";
import { handleAbrirSessaoDeCuradoria } from "api/curadoria/handlers/abrir-sessao-de-curadoria.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jornadaId: string }> },
) {
  try {
    const { jornadaId } = await context.params;
    return handleAbrirSessaoDeCuradoria(application, jornadaId);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
