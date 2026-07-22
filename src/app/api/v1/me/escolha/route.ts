import { application } from "@/infrastructure/composition-root";
import { handleRegistrarEscolha } from "api/jornada/handlers/registrar-escolha.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleRegistrarEscolha(application, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
