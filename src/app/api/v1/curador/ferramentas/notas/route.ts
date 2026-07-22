import { handleCriarNota, handleListarNotas } from "api/curador/handlers/curador-tools.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return handleListarNotas(searchParams);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleCriarNota(body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
