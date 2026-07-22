import { DomainError } from "./domain-error";

export class BusinessRuleError extends DomainError {
  readonly code = "BUSINESS_RULE_VIOLATION";

  constructor(message: string) {
    super(message);
  }
}
