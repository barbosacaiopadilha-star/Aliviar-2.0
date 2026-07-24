import { application } from "@/infrastructure/composition-root";
import { handleObterDossiePaciente } from "api/jornada/handlers/me-dossie.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST() {
  try {
    return handleObterDossiePaciente(application);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}