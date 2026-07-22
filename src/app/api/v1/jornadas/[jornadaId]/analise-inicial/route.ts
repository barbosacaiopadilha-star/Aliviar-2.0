import { application } from "@/infrastructure/composition-root";
import { handleExecutarAnaliseInicial } from "api/analise/handlers/executar-analise-inicial.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(
  request: Request,
  context: { params: Promise<{ jornadaId: string }> },
) {
  try {
    const { jornadaId } = await context.params;
    const body = await request.json();
    return handleExecutarAnaliseInicial(application, jornadaId, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
