import { DomainError } from "./domain-error";

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
