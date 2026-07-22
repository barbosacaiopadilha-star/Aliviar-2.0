import type { DomainError } from "@/domain/shared/errors/domain-error";
import type { Result } from "@/domain/shared/result";
import { presentApplicationError, type ApplicationErrorView } from "./present-application-error";

export type ApplicationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApplicationErrorView };

export async function toApplicationResult<T>(
  promise: Promise<Result<T, DomainError>>,
): Promise<ApplicationResult<T>> {
  const result = await promise;
  if (!result.ok) {
    return { ok: false, error: presentApplicationError(result.error) };
  }
  return { ok: true, value: result.value };
}
