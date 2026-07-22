import type { ApiErrorResponse, ApiSuccessResponse } from "../errors/api-error-response";

export function jsonResponse<T>(status: number, body: ApiSuccessResponse<T> | ApiErrorResponse): Response {
  return Response.json(body, { status });
}

export function successResponse<T>(data: T, status = 200): Response {
  return jsonResponse(status, { data });
}

export function errorResponse(status: number, body: ApiErrorResponse): Response {
  return jsonResponse(status, body);
}
