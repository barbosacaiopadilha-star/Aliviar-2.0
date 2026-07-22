import {
  handleObterIndicadoresQualidade,
  handleObterPainelQualidade,
} from "api/quality/handlers/quality.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "indicadores") {
      return handleObterIndicadoresQualidade();
    }
    return handleObterPainelQualidade();
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
