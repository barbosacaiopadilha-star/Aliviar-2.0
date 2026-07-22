import { application } from "@/infrastructure/composition-root";
import { handleObterJornadaDoPaciente } from "api/jornada/handlers/obter-jornada-do-paciente.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ jornadaId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jornadaId } = await context.params;
    return handleObterJornadaDoPaciente(application, jornadaId);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
