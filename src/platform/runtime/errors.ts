// Erros explícitos do runtime — nunca uma string solta. Mesmo padrão de
// ConnectionError (src/modules/connection/errors.ts): código fechado,
// rastreável, nunca genérico.

export type RuntimeErrorCode =
  | "INVALID_TRANSITION"
  | "BOOTSTRAP_FAILED"
  | "DUPLICATE_DEPENDENCY"
  | "BOOTSTRAP_SEALED"
  | "SHUTDOWN_PLAN_INVALID";

export class RuntimeError extends Error {
  readonly code: RuntimeErrorCode;

  constructor(params: { code: RuntimeErrorCode; message: string }) {
    super(params.message);
    this.name = "RuntimeError";
    this.code = params.code;
  }
}
