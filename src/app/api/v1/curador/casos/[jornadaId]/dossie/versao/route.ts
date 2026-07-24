import { application } from "@/infrastructure/composition-root";
import { handleCriarVersaoDossie } from "api/curador/handlers/dossie.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ jornadaId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { jornadaId } = await context.params;
    return handleCriarVersaoDossie(application, jornadaId);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
