import {
  handleAtualizarConfiguracao,
  handleObterConfiguracao,
} from "api/admin/handlers/governance.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET() {
  try {
    return handleObterConfiguracao();
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return handleAtualizarConfiguracao(body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
