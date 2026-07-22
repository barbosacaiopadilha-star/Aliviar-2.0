import { DomainError } from "./domain-error";

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";

  constructor(resource: string) {
    super(`${resource} não encontrado.`);
  }
}
