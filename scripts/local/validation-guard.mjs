/**
 * GUARDA DAS VALIDAÇÕES HOSPEDADAS.
 *
 * `validation:e2e` e `validation:e2e:b6` criam contas, criam Cases e apagam
 * usuários. Eles resolvem o alvo por `.env.local` — que hoje aponta para
 * PRODUÇÃO. Ou seja: rodar qualquer um deles hoje criaria e excluiria contas
 * no banco que atende pacientes reais.
 *
 * A guarda inverte o padrão: em vez de "roda a menos que seja produção",
 * vale "só roda contra um projeto explicitamente autorizado". A allowlist
 * nasce VAZIA de propósito — não existe hoje, no repositório, nenhum projeto
 * hospedado comprovadamente autorizado para isso. Autorizar é ato consciente
 * de quem opera, por variável de ambiente, uma execução por vez.
 *
 * A recusa acontece na leitura do ambiente, antes do primeiro client existir.
 */

import { ehSupabaseLocal, refDoProjeto } from "../env-guard.mjs";

/** Variável que autoriza um projeto hospedado, uma execução por vez. */
export const VAR_AUTORIZACAO = "ALIVIAR_VALIDATION_PROJECT_REF";

/**
 * O que se sabe sobre cada projeto já visto neste repositório.
 *
 * `jfhxtwumrurqghuueawi` entrou em ff6243f (2026-07-24), junto da ferramenta
 * de homologação da era ALICIA. Hoje nada aponta para ele: `.env.local` vai
 * para produção, a CLI está linkada a produção, e o próprio VALIDATION.md
 * registra que o schema dele pode estar defasado. Não dá para provar pelo
 * repositório se ainda existe — e ambiente cujo estado não se conhece é
 * ambiente bloqueado, nunca ambiente presumido inofensivo.
 */
export const AMBIENTES_CONHECIDOS = {
  awdlmeykminwyifnygkm: {
    nome: "produção — Aliviar Curadoria",
    autorizavel: false,
    motivo: "é produção: atende pacientes reais",
  },
  jfhxtwumrurqghuueawi: {
    nome: "homologação legada (era ALICIA, commit ff6243f)",
    autorizavel: false,
    motivo: "legado de estado desconhecido — nada no repositório aponta para ele desde 2026-07-24",
  },
};

export class ValidacaoBloqueadaError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = "ValidacaoBloqueadaError";
  }
}

/** Como o ambiente se identifica, impresso antes de qualquer execução. */
export function descreverAmbiente(url) {
  if (ehSupabaseLocal(url)) return "LOCAL (stack Supabase em Docker)";
  const ref = refDoProjeto(url);
  if (!ref) return `DESCONHECIDO (${url ?? "sem URL"})`;
  const conhecido = AMBIENTES_CONHECIDOS[ref];
  return conhecido ? `${ref} — ${conhecido.nome}` : `${ref} — projeto não reconhecido`;
}

/**
 * A guarda. Lança — nunca devolve `false`.
 *
 * @param {string | undefined} url
 * @param {string} comando
 * @param {Record<string, string | undefined>} [ambiente] — injetável para teste
 */
export function assertValidacaoAutorizada(url, comando, ambiente = process.env) {
  if (ehSupabaseLocal(url)) return url;

  const ref = refDoProjeto(url);

  if (!ref) {
    throw new ValidacaoBloqueadaError(
      `${comando} bloqueado: o alvo (${url ?? "sem URL"}) não é a stack local nem um projeto Supabase reconhecível.`,
    );
  }

  const conhecido = AMBIENTES_CONHECIDOS[ref];
  if (conhecido && !conhecido.autorizavel) {
    throw new ValidacaoBloqueadaError(
      `${comando} bloqueado: o alvo é ${ref} (${conhecido.nome}) — ${conhecido.motivo}. ` +
        "Este comando cria e exclui contas; nenhuma autorização o libera para este projeto.",
    );
  }

  const autorizado = ambiente[VAR_AUTORIZACAO];
  if (!autorizado) {
    throw new ValidacaoBloqueadaError(
      `${comando} bloqueado: o alvo é ${ref}, que não está na allowlist. ` +
        `A allowlist nasce vazia — para autorizar uma execução, defina ${VAR_AUTORIZACAO}=${ref} ` +
        "sabendo que este comando cria e exclui contas nesse projeto.",
    );
  }

  if (autorizado !== ref) {
    throw new ValidacaoBloqueadaError(
      `${comando} bloqueado: ${VAR_AUTORIZACAO} autoriza ${autorizado}, mas o alvo é ${ref}. ` +
        "A autorização vale para um projeto só, e é o alvo que tem de mudar — nunca a autorização.",
    );
  }

  return url;
}
