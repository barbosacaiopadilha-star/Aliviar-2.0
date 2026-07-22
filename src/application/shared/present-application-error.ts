import type { DomainError } from "@/domain/shared/errors/domain-error";
import { ValidationError } from "@/domain/shared/errors/validation-error";

export interface ApplicationErrorView {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export function presentApplicationError(error: DomainError): ApplicationErrorView {
  return {
    code: error.code,
    message: error.message,
    fieldErrors: error instanceof ValidationError ? error.fieldErrors : undefined,
  };
}
