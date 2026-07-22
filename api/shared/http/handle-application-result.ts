import type { ApplicationErrorView } from "@/application/shared/present-application-error";
import { mapApplicationErrorToApiResponse, mapUnknownToApiResponse } from "../errors/application-error-mapper";
import { errorResponse, successResponse } from "../http/response";

export async function handleApplicationResult<TOutput, TResponse>(
  resultPromise: Promise<
    { ok: true; value: TOutput } | { ok: false; error: ApplicationErrorView }
  >,
  mapSuccess: (output: TOutput) => TResponse,
  successStatus = 200,
): Promise<Response> {
  try {
    const result = await resultPromise;

    if (!result.ok) {
      const mapped = mapApplicationErrorToApiResponse(result.error);
      return errorResponse(mapped.status, mapped.body);
    }

    return successResponse(mapSuccess(result.value), successStatus);
  } catch (error) {
    const mapped = mapUnknownToApiResponse(error);
    return errorResponse(mapped.status, mapped.body);
  }
}
