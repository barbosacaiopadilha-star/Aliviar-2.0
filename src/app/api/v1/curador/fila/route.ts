import { application } from "@/infrastructure/composition-root";
import { handleListarFilaCurador } from "api/curador/handlers/curador-portal.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET() {
  try {
    return handleListarFilaCurador(application);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
