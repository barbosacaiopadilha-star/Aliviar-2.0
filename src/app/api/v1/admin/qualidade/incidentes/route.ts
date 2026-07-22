import { handleCriarIncidente } from "api/quality/handlers/quality.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleCriarIncidente(body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
