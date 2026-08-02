import "server-only";

/**
 * Erros rastreáveis (Release de Reconstrução, ETAPA 2).
 *
 * A regra que motivou este módulo: toda falha real do sistema chegava ao
 * usuário como "Não foi possível... Tente novamente." e chegava ao log como
 * NADA — o `catch` descartava a exceção original. Um erro de RLS, um enum
 * inválido e uma queda de rede eram indistinguíveis.
 *
 * O contrato daqui em diante:
 * - a causa original NUNCA é descartada: vive em `cause`, com stack;
 * - todo erro registrado ganha um código de referência curto, que aparece
 *   também na mensagem ao usuário — quem reporta "ref. ERR-ABC123" aponta
 *   exatamente a linha de log correspondente;
 * - a interface recebe uma frase adequada, nunca detalhe técnico sensível;
 * - o tipo do erro é classificado (validação, autorização, banco, rede,
 *   inesperado) — na origem quando conhecido, por heurística quando não.
 */

export type TipoDeErro = "validacao" | "autorizacao" | "banco" | "rede" | "inesperado";

type ContextoDeErro = Record<string, string | number | boolean | null | undefined>;

export class ErroDaAplicacao extends Error {
  readonly tipo: TipoDeErro;
  readonly contexto: ContextoDeErro;

  constructor(
    mensagem: string,
    opcoes: { tipo: TipoDeErro; cause?: unknown; contexto?: ContextoDeErro },
  ) {
    super(mensagem, { cause: opcoes.cause });
    this.name = "ErroDaAplicacao";
    this.tipo = opcoes.tipo;
    this.contexto = opcoes.contexto ?? {};
  }
}

/** Erro vindo do PostgREST/Supabase — preserva code/details/hint na causa. */
export function erroDeBanco(
  mensagem: string,
  causa: unknown,
  contexto?: ContextoDeErro,
): ErroDaAplicacao {
  return new ErroDaAplicacao(mensagem, { tipo: "banco", cause: causa, contexto });
}

export function erroDeAutorizacao(mensagem: string, contexto?: ContextoDeErro): ErroDaAplicacao {
  return new ErroDaAplicacao(mensagem, { tipo: "autorizacao", contexto });
}

function classificar(erro: unknown): TipoDeErro {
  if (erro instanceof ErroDaAplicacao) return erro.tipo;
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro);
  if (/fetch failed|network|ECONNREFUSED|ETIMEDOUT|socket/i.test(texto)) return "rede";
  if (/row-level security|permission denied|not authorized|jwt/i.test(texto)) return "autorizacao";
  return "inesperado";
}

function novaReferencia(): string {
  // Curta o bastante para ser dita por telefone, única o bastante para um log.
  const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase();
  const tempo = Date.now().toString(36).slice(-4).toUpperCase();
  return `ERR-${tempo}${aleatorio}`;
}

type CausaSerializada = {
  name?: string;
  message?: string;
  stack?: string;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function serializarCausa(causa: unknown): CausaSerializada | undefined {
  if (causa == null) return undefined;
  if (causa instanceof Error) {
    return { name: causa.name, message: causa.message, stack: causa.stack };
  }
  if (typeof causa === "object") {
    const bruto = causa as Record<string, unknown>;
    return {
      name: typeof bruto.name === "string" ? bruto.name : undefined,
      message: typeof bruto.message === "string" ? bruto.message : String(causa),
      code: bruto.code,
      details: bruto.details,
      hint: bruto.hint,
    };
  }
  return { message: String(causa) };
}

/**
 * Registra o erro completo no log do servidor e devolve a referência.
 * O log carrega tudo (stack, causa, contexto); a interface, nada disso.
 */
export function registrarErro(escopo: string, erro: unknown, contexto?: ContextoDeErro): string {
  const referencia = novaReferencia();
  const tipo = classificar(erro);
  const proprio = erro instanceof Error ? erro : undefined;

  console.error(
    JSON.stringify({
      nivel: "error",
      referencia,
      escopo,
      tipo,
      mensagem: proprio?.message ?? String(erro),
      stack: proprio?.stack,
      causa: serializarCausa(proprio?.cause ?? (proprio ? undefined : erro)),
      contexto: {
        ...(erro instanceof ErroDaAplicacao ? erro.contexto : {}),
        ...contexto,
      },
      quando: new Date().toISOString(),
    }),
  );

  return referencia;
}

const FRASE_POR_TIPO: Record<TipoDeErro, string> = {
  validacao: "Confira os dados informados e tente novamente.",
  autorizacao: "Você não tem permissão para esta ação.",
  banco: "Não foi possível concluir a operação.",
  rede: "Falha de comunicação com o servidor. Verifique a conexão e tente novamente.",
  inesperado: "Algo inesperado aconteceu.",
};

/**
 * Registra e devolve a mensagem pronta para a interface: a frase da ação
 * (quando fornecida) ou a frase do tipo, sempre com a referência ao final.
 */
export function falhaParaUsuario(
  escopo: string,
  erro: unknown,
  opcoes?: { mensagem?: string; contexto?: ContextoDeErro },
): string {
  const referencia = registrarErro(escopo, erro, opcoes?.contexto);
  const frase = opcoes?.mensagem ?? FRASE_POR_TIPO[classificar(erro)];
  return `${frase} (ref. ${referencia})`;
}
