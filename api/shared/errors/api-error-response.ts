export interface ApiErrorBody {
  code: string;
  message: string;
  domainCode?: string;
  traceId: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiErrorResponse(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return "error" in response;
}
