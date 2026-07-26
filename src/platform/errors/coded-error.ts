/**
 * ERRO CODIFICADO — a base de todo erro estruturado da Plataforma.
 *
 * Por que existe: a plataforma tinha três implementações do mesmo padrão —
 * `RuntimeError` (platform/runtime), `ProtocolError` (ace/core) e
 * `ConnectionError` (modules/connection). Todas diziam a mesma coisa: um erro
 * carrega um código de um conjunto fechado, nunca uma string solta. Três vezes
 * a mesma disciplina é três lugares onde ela pode divergir.
 *
 * O que esta base NÃO faz: definir os códigos. O conjunto de códigos é sempre
 * do módulo, porque só ele sabe o que pode dar errado no seu domínio. A
 * Plataforma garante a forma; o módulo garante o vocabulário.
 *
 * Esta camada não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem
 * Administrador. Conhece erro.
 */

/** Contexto adicional de um erro. Nunca substitui a mensagem — acompanha. */
export type ErrorContext = Readonly<Record<string, string | number | boolean | null>>;

export type CodedErrorParams<TCode extends string> = {
  code: TCode;
  message: string;
  /** Onde o erro nasceu, em vocabulário do módulo (ex.: "P007", "connection"). */
  origin?: string;
  context?: ErrorContext;
  cause?: unknown;
};

/**
 * Erro com código fechado e rastreável.
 *
 * Genérico no conjunto de códigos para que cada módulo especialize sem perder
 * a verificação de tipo: `class ProtocolError extends CodedError<ProtocolErrorCode>`.
 */
export class CodedError<TCode extends string = string> extends Error {
  readonly code: TCode;
  readonly origin: string | null;
  readonly context: ErrorContext | null;

  constructor(params: CodedErrorParams<TCode>) {
    super(params.message, params.cause === undefined ? undefined : { cause: params.cause });
    this.name = new.target.name;
    this.code = params.code;
    this.origin = params.origin ?? null;
    this.context = params.context ?? null;
  }

  /**
   * Forma serializável para log e auditoria.
   *
   * Deliberadamente sem `stack`: rastro de pilha é diagnóstico de
   * desenvolvedor, não registro de auditoria — e pode carregar caminho de
   * arquivo e dado de ambiente para onde não deve.
   */
  toRecord(): Readonly<{
    name: string;
    code: TCode;
    message: string;
    origin: string | null;
    context: ErrorContext | null;
  }> {
    return Object.freeze({
      name: this.name,
      code: this.code,
      message: this.message,
      origin: this.origin,
      context: this.context,
    });
  }
}

/** Reconhece um erro codificado sem depender de `instanceof` entre bundles. */
export function isCodedError(value: unknown): value is CodedError {
  return (
    value instanceof Error &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { toRecord?: unknown }).toRecord === "function"
  );
}

/**
 * Extrai um código conhecido de um erro qualquer.
 *
 * Existe porque a fronteira entre módulos recebe `unknown` — e a alternativa
 * seria cada chamador reimplementar a mesma checagem defensiva.
 */
export function codeOf<TCode extends string>(
  value: unknown,
  allowed: readonly TCode[],
): TCode | null {
  if (!isCodedError(value)) return null;
  return (allowed as readonly string[]).includes(value.code) ? (value.code as TCode) : null;
}
