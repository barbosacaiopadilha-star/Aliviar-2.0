// Contrato de erro do ACE — a forma agora vem da Plataforma; o vocabulário
// continua sendo do ACE (docs/ace/03-kernel/kernel.md, seção 4).
//
// A disciplina "todo erro carrega um código de um conjunto fechado" era
// reimplementada em três lugares (platform/runtime, ace/core, connection) e
// foi absorvida em `src/platform/errors/coded-error.ts`. O conjunto de códigos
// permanece aqui, porque só o ACE sabe o que pode dar errado num protocolo.
//
// A API pública é a de antes: `code`, `protocolId`, `message`.

import { CodedError } from "@/platform/errors/coded-error";

import type { ProtocolId } from "./protocol-id";

export type ProtocolErrorCode =
  | "INVALID_INPUT"
  | "VALIDATION_FAILED"
  | "FORBIDDEN_FIELD_PRESENT"
  | "MISSING_REQUIRED_FIELD"
  | "CONTENT_INVARIANT_VIOLATION";

export class ProtocolError extends CodedError<ProtocolErrorCode> {
  readonly protocolId: ProtocolId;

  constructor(params: { code: ProtocolErrorCode; protocolId: ProtocolId; message: string }) {
    // `origin` da Plataforma é o protocolo: é assim que um log genérico
    // consegue dizer de onde o erro veio sem precisar conhecer o ACE.
    super({ code: params.code, message: params.message, origin: params.protocolId });
    this.name = "ProtocolError";
    this.protocolId = params.protocolId;
  }
}
