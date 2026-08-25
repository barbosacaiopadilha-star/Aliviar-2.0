/**
 * SUGESTÕES DE LEITURA — o campo em branco deixa de ser o começo do trabalho.
 *
 * @metodo PROTOCOLO_PESSOA.md — a leitura proposta e o reconhecimento dela
 * @metodo ADR-042 — reconhecer é ato exclusivo dela
 * @metodo ADR-068 — "não existe confirmação automática": nove formas nomeadas
 *         e proibidas, entre elas a caixa pré-marcada
 *
 * As perguntas de TRADUÇÃO pedem que o Curador escreva o que entendeu, na
 * forma "Pelo que você me contou, entendi que… É isso?" — e ela reconhece,
 * corrige ou recusa. É o ato mais delicado do Protocolo: o Curador está
 * devolvendo a ela as próprias palavras, reorganizadas.
 *
 * O campo nasce em branco. Escrever do zero, dezenas de vezes por Curadoria,
 * é o que faz alguém abreviar — e uma leitura abreviada devolve a ela menos do
 * que ela disse.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A REGRA QUE GOVERNA ESTE ARQUIVO INTEIRO
 *
 * A sugestão é OFERECIDA, nunca PRÉ-PREENCHIDA. Um campo que já vem escrito é
 * o software assinando no lugar de quem responde pelo juízo, e a ADR-068 nomeia
 * exatamente isso entre as formas proibidas de confirmação automática.
 *
 * E toda sugestão é montada SÓ do que já foi declarado — os rótulos que ela
 * marcou e o grau que ela deu. Nenhuma frase aqui acrescenta conteúdo que ela
 * não tenha dito. Se acrescentasse, o Curador estaria reconhecendo uma leitura
 * que a máquina inventou, e ela reconheceria uma frase que nunca disse.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { NEED_DEGREE_LABELS, type NeedDegree } from "./protocolos";

export type LeituraSugerida = {
  /** Como a sugestão se apresenta ao Curador, curto. */
  rotulo: string;
  /** O texto que entra no campo se ele escolher — e que ele pode editar. */
  texto: string;
};

/** "a, b e c" — a lista como se fala, não como se programa. */
function emPortugues(itens: readonly string[]): string {
  const limpos = itens.map((i) => i.trim()).filter((i) => i.length > 0);
  if (limpos.length === 0) return "";
  if (limpos.length === 1) return limpos[0].toLowerCase();
  const inicio = limpos.slice(0, -1).map((i) => i.toLowerCase()).join(", ");
  return `${inicio} e ${limpos[limpos.length - 1].toLowerCase()}`;
}

/**
 * O peso, dito como gente fala.
 *
 * `NEED_DEGREE_LABELS` traz o rótulo do formulário ("Essencial — sem isso o
 * cuidado não acontece"), que serve para escolher e não para ser lido de volta
 * a ela. Aqui a mesma informação vira frase.
 */
const PESO_EM_FRASE: Record<NeedDegree, string> = {
  ESSENCIAL: "isso não é preferência: sem isso o cuidado não funciona para você",
  PESA_MUITO: "isso pesa muito na sua escolha, ainda que não seja impedimento",
  DESEJAVEL: "isso seria bem-vindo, sem ser decisivo",
  SEM_PREFERENCIA: "você não tem preferência sobre isso",
};

export type EntradaDaSugestao = {
  /** Os rótulos das opções que ELA marcou — nunca os códigos. */
  opcoesMarcadas: readonly string[];
  grau: NeedDegree | null;
  /** O que ela escreveu com as próprias palavras, quando o Protocolo permite. */
  textoGuiado?: string | null;
};

/**
 * De duas a três leituras possíveis, para o Curador partir de uma.
 *
 * Elas diferem no ÂNGULO, não no conteúdo — é a mesma declaração dita de
 * formas diferentes, e é o Curador quem sabe qual delas soa como a pessoa que
 * ele acabou de ouvir.
 */
export function leiturasSugeridas(entrada: EntradaDaSugestao): readonly LeituraSugerida[] {
  const { opcoesMarcadas, grau, textoGuiado } = entrada;

  // Sem nada declarado não há o que sugerir. Devolver uma frase genérica seria
  // pior que devolver nada: daria ao Curador algo para confirmar sem ter ouvido.
  const lista = emPortugues(opcoesMarcadas);
  const guiado = textoGuiado?.trim() ?? "";
  if (lista.length === 0 && guiado.length === 0) return [];

  const sugestoes: LeituraSugerida[] = [];

  if (lista.length > 0) {
    sugestoes.push({
      rotulo: "Direta",
      texto: `Pelo que você me contou, entendi que ${lista} é o que faz diferença para você. É isso?`,
    });

    if (grau) {
      sugestoes.push({
        rotulo: "Com o peso que ela deu",
        texto: `Pelo que você me contou, entendi que ${lista} importa para você — e que ${PESO_EM_FRASE[grau]}. É isso?`,
      });
    }
  }

  // As palavras dela vêm primeiro quando existem: nenhuma opção de catálogo
  // representa melhor do que o que ela mesma escreveu.
  if (guiado.length > 0) {
    sugestoes.unshift({
      rotulo: "Nas palavras dela",
      texto: `Pelo que você me contou, entendi que ${guiado.replace(/\.$/, "")}. É isso?`,
    });
  }

  return sugestoes;
}
