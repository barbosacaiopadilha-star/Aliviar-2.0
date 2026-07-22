import { application } from "@/infrastructure/composition-root";
import { handleRegistrarDocumento } from "api/documentos/handlers/registrar-documento.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleRegistrarDocumento(application, body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
