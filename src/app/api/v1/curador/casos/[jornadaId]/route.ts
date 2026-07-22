import { application } from "@/infrastructure/composition-root";
import { handleObterCasoCurador } from "api/curador/handlers/curador-portal.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ jornadaId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jornadaId } = await context.params;
    return handleObterCasoCurador(application, jornadaId);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
