import { handleListarNotificacoes } from "api/notificacoes/handlers/notificacoes.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return handleListarNotificacoes(searchParams);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
