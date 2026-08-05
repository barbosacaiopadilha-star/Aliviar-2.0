/**
 * O CICLO DE VIDA DA REGRA DE DERIVAÇÃO — Item 2.2B.
 *
 * @metodo ADR-069 — a versão é fato imutável; a transição é ato; o estado é leitura
 * @metodo Arquitetura §10.5 — os oito atos e os quatro estados
 * @metodo Arquitetura §5.4 cond. 7 — o freio de emergência do Curador
 * @metodo Congelamento I-7 — histórico append-only
 *
 * Por que existe: `regra-de-derivacao-contrato.ts` descreve a VERSÃO — o fato.
 * Este arquivo descreve o ATO e a LEITURA. São dois objetos distintos, e
 * fundi-los reintroduziria, no tipo, a confusão que a ADR-069 desfez no banco.
 *
 * ESTE ARQUIVO É TIPO E FUNÇÃO PURA. Nenhum cliente, nenhuma escrita, nenhuma
 * emissão. O grafo e as autoridades aqui existem para que a mesma verdade possa
 * ser lida sem ir ao banco — **nunca para substituí-lo**. A autoridade real são
 * os CHECK e o índice único parcial; se um dia divergirem, o banco vence.
 *
 * O nome físico da tabela não aparece aqui, pelo mesmo motivo da 2.1 e da 2.2A:
 * a prova de que nenhum módulo de `src/` alcança a estrutura vale mais do que a
 * conveniência de repetir o nome.
 *
 * Puro: sem React, sem banco, sem execução.
 */

import { ESTADOS_DA_REGRA, type EstadoDaRegra } from "./regra-de-derivacao-contrato";

// ---------------------------------------------------------------------------
// Os três atores — ADR-069 §6.3
// ---------------------------------------------------------------------------

/**
 * Quem pratica o ato. Lista fechada.
 *
 * `PAPEL_INTERNO` é qualquer papel interno e pode **apenas propor** (§10.5 ato
 * 1). `AUTORIDADE_DE_METODO` exerce os oito atos. `CURADOR_DO_CASE` tem
 * **apenas o freio** — e a assimetria é deliberada: freio é freio, não volante.
 */
export const AUTORIDADES_DA_TRANSICAO = [
  "PAPEL_INTERNO",
  "AUTORIDADE_DE_METODO",
  "CURADOR_DO_CASE",
] as const;

export type AutoridadeDaTransicao = (typeof AUTORIDADES_DA_TRANSICAO)[number];

// ---------------------------------------------------------------------------
// O grafo — ADR-069 §7, lista fechada
// ---------------------------------------------------------------------------

/**
 * `null` como origem é o nascimento: não havia estado antes dele.
 *
 * A matriz da ADR avalia onze pares; seis são permitidos (o nascimento e cinco
 * saídas) e cinco são recusados. Os recusados não aparecem aqui como exceções:
 * eles simplesmente **não existem** na estrutura — que é o que torna o grafo
 * fechado por construção, e não por verificação.
 */
export type OrigemDaTransicao = EstadoDaRegra | null;

const GRAFO: ReadonlyMap<OrigemDaTransicao, readonly EstadoDaRegra[]> = new Map([
  // Nascimento — e nenhuma versão nasce em outro estado (§9).
  [null, ["PROPOSTA"] as const],
  // Não se revoga o que nunca valeu: `PROPOSTA → REVOGADA` não existe (§6.2).
  ["PROPOSTA" as EstadoDaRegra, ["VIGENTE", "SUSPENSA"] as const],
  ["VIGENTE" as EstadoDaRegra, ["SUSPENSA", "REVOGADA"] as const],
  ["SUSPENSA" as EstadoDaRegra, ["VIGENTE", "REVOGADA"] as const],
  // `REVOGADA` é terminal, absolutamente: a chave existe e a lista é vazia,
  // para que a terminalidade seja um fato declarado e não uma omissão.
  ["REVOGADA" as EstadoDaRegra, [] as const],
]);

/** Os destinos alcançáveis a partir de uma origem. Vazio é resposta legítima. */
export function destinosPermitidos(origem: OrigemDaTransicao): readonly EstadoDaRegra[] {
  return GRAFO.get(origem) ?? [];
}

/**
 * A pergunta do grafo. Recusa também `X → X`: transição sem mudança não é ato
 * (§7) — e a recusa vem de graça, porque nenhuma lista contém a própria origem.
 */
export function transicaoPermitida(origem: OrigemDaTransicao, destino: EstadoDaRegra): boolean {
  return destinosPermitidos(origem).includes(destino);
}

/** `REVOGADA` é terminal. Nenhuma transição parte dela (§6.1). */
export function estadoTerminal(estado: EstadoDaRegra): boolean {
  return destinosPermitidos(estado).length === 0;
}

// ---------------------------------------------------------------------------
// Autoridade por transição — ADR-069 §12
// ---------------------------------------------------------------------------

/**
 * Quem pode praticar cada ato.
 *
 * O freio do Curador aparece em UM par só, e é isso que o torna freio: ele
 * pode desligar (`VIGENTE → SUSPENSA`) e **não pode religar**. Quem para uma
 * regra em curso não é quem decide que ela voltou a servir.
 */
export function autoridadesQuePodem(
  origem: OrigemDaTransicao,
  destino: EstadoDaRegra,
): readonly AutoridadeDaTransicao[] {
  if (!transicaoPermitida(origem, destino)) return [];
  if (origem === null) return ["PAPEL_INTERNO", "AUTORIDADE_DE_METODO"];
  if (origem === "VIGENTE" && destino === "SUSPENSA") {
    return ["AUTORIDADE_DE_METODO", "CURADOR_DO_CASE"];
  }
  return ["AUTORIDADE_DE_METODO"];
}

export function podeTransicionar(
  autoridade: AutoridadeDaTransicao,
  origem: OrigemDaTransicao,
  destino: EstadoDaRegra,
): boolean {
  return autoridadesQuePodem(origem, destino).includes(autoridade);
}

/** Entrada em `VIGENTE` e qualquer entrada em `REVOGADA` exigem ADR (§12). */
export function exigeAdr(destino: EstadoDaRegra): boolean {
  return destino === "VIGENTE" || destino === "REVOGADA";
}

/**
 * A justificativa de emergência é **exclusiva do freio** (§12 regra 2): existe
 * para que a Autoridade, ao revisar, saiba por que alguém precisou parar a
 * regra sem esperar por ela. Ninguém mais a usa.
 */
export function exigeJustificativaDeEmergencia(
  autoridade: AutoridadeDaTransicao,
  origem: OrigemDaTransicao,
  destino: EstadoDaRegra,
): boolean {
  return autoridade === "CURADOR_DO_CASE" && origem === "VIGENTE" && destino === "SUSPENSA";
}

// ---------------------------------------------------------------------------
// A leitura derivada — ADR-069 §8.2
// ---------------------------------------------------------------------------

/** Uma transição, como o domínio a lê. `readonly` porque o ato não se reescreve. */
export type TransicaoDaRegra = {
  readonly identificador: string;
  readonly versao: number;
  /** Ordinal monotônico por versão. Nunca o relógio (§11). */
  readonly ordem: number;
  readonly origem: OrigemDaTransicao;
  readonly destino: EstadoDaRegra;
  readonly autorId: string;
  readonly autoridade: AutoridadeDaTransicao;
  readonly motivo: string;
  readonly adrDeAprovacao: string | null;
  readonly justificativaDeEmergencia: string | null;
  /** Quando aconteceu. Fato, nunca chave de ordenação. */
  readonly ocorridaEm: string;
};

/**
 * O estado corrente: o destino da última transição, **pela ordem monotônica**.
 *
 * `null` quando não há transição — e isso significa que a versão não existe,
 * não que ela esteja em algum estado implícito. Nenhuma heurística: nem "maior
 * versão", nem "mais recente por data", nem `derivation_rules.state`, que diz
 * como a versão nasceu e não afirma nada sobre onde ela está.
 */
export function estadoCorrente(
  transicoes: readonly TransicaoDaRegra[],
): EstadoDaRegra | null {
  if (transicoes.length === 0) return null;
  return transicoes.reduce((maior, atual) => (atual.ordem > maior.ordem ? atual : maior)).destino;
}

/**
 * O estado inicial: o destino da PRIMEIRA transição. Sempre `PROPOSTA` (§9).
 *
 * Existe separado de `estadoCorrente` porque são fatos diferentes — um diz
 * como nasceu, o outro diz onde está —, e é essa diferença que impede as duas
 * fontes de divergirem: elas não afirmam a mesma coisa.
 */
export function estadoInicial(
  transicoes: readonly TransicaoDaRegra[],
): EstadoDaRegra | null {
  if (transicoes.length === 0) return null;
  return transicoes.reduce((menor, atual) => (atual.ordem < menor.ordem ? atual : menor)).destino;
}

/** A versão vigente de uma regra, ou `null`. No máximo uma (MR1.2, §8). */
export function versaoVigente(
  porVersao: ReadonlyMap<number, readonly TransicaoDaRegra[]>,
): number | null {
  for (const [versao, transicoes] of porVersao) {
    if (estadoCorrente(transicoes) === "VIGENTE") return versao;
  }
  return null;
}

/** Guarda de leitura: o estado veio da lista fechada do §10.5. */
export function isEstadoDaRegra(valor: string): valor is EstadoDaRegra {
  return (ESTADOS_DA_REGRA as readonly string[]).includes(valor);
}

export function isAutoridadeDaTransicao(valor: string): valor is AutoridadeDaTransicao {
  return (AUTORIDADES_DA_TRANSICAO as readonly string[]).includes(valor);
}
