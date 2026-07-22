import {
  handleObterPreferencias,
  handleSalvarPreferencias,
} from "api/notificacoes/handlers/notificacoes.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET() {
  try {
    return handleObterPreferencias();
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return handleSalvarPreferencias(body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
