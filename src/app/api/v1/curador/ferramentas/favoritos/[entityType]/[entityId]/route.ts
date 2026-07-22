import { handleRemoverFavorito } from "api/curador/handlers/curador-tools.handler";
import type { CuratorFavoriteEntityType } from "@/curator-tools-flow/contracts/curator-tools";
import { mapUnknownToApiResponse } from "api/shared/errors/application-error-mapper";
import { errorResponse } from "api/shared/http/response";

interface RouteContext {
  params: Promise<{ entityType: string; entityId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { entityType, entityId } = await context.params;
    return handleRemoverFavorito(entityType as CuratorFavoriteEntityType, entityId);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
