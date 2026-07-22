import { handlePesquisarAuditoria } from "api/admin/handlers/governance.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return handlePesquisarAuditoria(searchParams);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
