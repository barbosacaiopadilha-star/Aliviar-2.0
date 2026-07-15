// Erros explícitos do domínio Connection — nunca uma string solta. Mesmo
// padrão de ProtocolError (src/modules/ace/core/error-contract.ts):
// código fechado, rastreável, nunca genérico.

export type ConnectionErrorCode =
  | "INVALID_TRANSITION"
  | "TERMINAL_STATE"
  | "CORRECTION_NOT_ALLOWED"
  | "PROFESSIONAL_NOT_IN_DELIVERY"
  | "NOT_OWNER"
  // Adicionado no PR3 (repository/persistência) — achado da Etapa 1: nenhum
  // dos 5 códigos do PR2 distingue "outra requisição já transicionou este
  // Connection entre a leitura e esta escrita" de um erro de domínio comum.
  // É um conceito de concorrência de persistência, não uma regra de negócio
  // nova — necessário para a Etapa 7 (diferenciar "conflito concorrente" de
  // "estado inválido") do PR3.
  | "CONCURRENT_CONFLICT";

export class ConnectionError extends Error {
  readonly code: ConnectionErrorCode;

  constructor(params: { code: ConnectionErrorCode; message: string }) {
    super(params.message);
    this.name = "ConnectionError";
    this.code = params.code;
  }
}
