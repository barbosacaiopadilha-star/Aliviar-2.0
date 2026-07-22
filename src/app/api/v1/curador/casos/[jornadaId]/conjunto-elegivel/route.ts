import { application } from "@/infrastructure/composition-root";
import { handleSalvarConjuntoElegivel } from "api/curador/handlers/curador-portal.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ jornadaId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { jornadaId } = await context.params;
    const body = await request.json();
    return handleSalvarConjuntoElegivel(application, jornadaId, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
