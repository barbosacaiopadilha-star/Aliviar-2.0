import { application } from "@/infrastructure/composition-root";
import { handleAvancarParaEscolha } from "api/jornada/handlers/me-jornada.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST() {
  try {
    return handleAvancarParaEscolha(application);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
