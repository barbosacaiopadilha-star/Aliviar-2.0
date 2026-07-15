// Contrato de erro — todo erro de protocolo é estruturado e rastreável
// (docs/ace/03-kernel/kernel.md, seção 4: auditabilidade e reprodutibilidade).

import type { ProtocolId } from "./protocol-id";

export type ProtocolErrorCode =
  | "INVALID_INPUT"
  | "VALIDATION_FAILED"
  | "FORBIDDEN_FIELD_PRESENT"
  | "MISSING_REQUIRED_FIELD"
  | "CONTENT_INVARIANT_VIOLATION";

export class ProtocolError extends Error {
  readonly code: ProtocolErrorCode;
  readonly protocolId: ProtocolId;

  constructor(params: { code: ProtocolErrorCode; protocolId: ProtocolId; message: string }) {
    super(params.message);
    this.name = "ProtocolError";
    this.code = params.code;
    this.protocolId = params.protocolId;
  }
}
