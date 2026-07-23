import { ApiErrorCode } from "./api-error-code";
import type { ApplicationErrorView } from "@/application/shared/present-application-error";
import type { ApiErrorResponse } from "./api-error-response";
import { randomUUID } from "crypto";

const STATUS_BY_DOMAIN_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  BUSINESS_RULE_VIOLATION: 422,
};

const API_CODE_BY_DOMAIN_CODE: Record<string, ApiErrorCode> = {
  VALIDATION_ERROR: ApiErrorCode.VALIDATION_ERROR,
  UNAUTHORIZED: ApiErrorCode.UNAUTHORIZED,
  NOT_FOUND: ApiErrorCode.NOT_FOUND,
  BUSINESS_RULE_VIOLATION: ApiErrorCode.BUSINESS_RULE_VIOLATION,
};

export function mapApplicationErrorToApiResponse(error: ApplicationErrorView): {
  status: number;
  body: ApiErrorResponse;
} {
  const apiCode = API_CODE_BY_DOMAIN_CODE[error.code] ?? ApiErrorCode.INTERNAL_ERROR;

  return {
    status: STATUS_BY_DOMAIN_CODE[error.code] ?? 500,
    body: {
      error: {
        code: apiCode,
        message: error.message,
        domainCode: error.code,
        traceId: randomUUID(),
        fieldErrors: error.fieldErrors,
      },
    },
  };
}

export function mapValidationToApiResponse(
  message: string,
  fieldErrors?: Record<string, string>,
): { status: number; body: ApiErrorResponse } {
  return mapApplicationErrorToApiResponse({
    code: "VALIDATION_ERROR",
    message,
    fieldErrors,
  });
}

export function mapNotFoundToApiResponse(
  message: string,
): { status: number; body: ApiErrorResponse } {
  return mapApplicationErrorToApiResponse({
    code: "NOT_FOUND",
    message,
  });
}

export function mapUnknownToApiResponse(error: unknown): { status: number; body: ApiErrorResponse } {
  const message = error instanceof Error ? error.message : "Erro interno inesperado.";

  return {
    status: 500,
    body: {
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message,
        traceId: randomUUID(),
      },
    },
  };
}
