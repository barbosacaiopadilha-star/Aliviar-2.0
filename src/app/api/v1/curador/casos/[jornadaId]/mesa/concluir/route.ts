import { application } from "@/infrastructure/composition-root";
import { handleConcluirMesa } from "api/curador/handlers/dossie.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ jornadaId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jornadaId } = await context.params;
    const body = await request.json();
    return handleConcluirMesa(application, jornadaId, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
