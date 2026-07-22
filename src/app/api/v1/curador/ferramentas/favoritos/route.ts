import {
  handleAdicionarFavorito,
  handleListarFavoritos,
} from "api/curador/handlers/curador-tools.handler";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

export async function GET() {
  try {
    return handleListarFavoritos();
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return handleAdicionarFavorito(body);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
