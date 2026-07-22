import { DomainError } from "./domain-error";

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";

  constructor(message = "Perfil interno ativo obrigatório.") {
    super(message);
  }
}
