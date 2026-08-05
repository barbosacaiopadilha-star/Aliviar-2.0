import { PERSON_PROTOCOL } from "@/modules/curadoria/protocolos";
import type { CaseNeedRecord } from "@/modules/curadoria/protocolos-repository";

/**
 * O QUE ELA RESPONDEU QUE O CURADOR PRECISA LER — Item 1.10C-A.
 *
 * @metodo M-001 §6.2.1 — os quatro desfechos do reconhecimento
 * @metodo DT-22 — `CORRIGIDA` e `RECUSADA` guardam o texto dela
 * @metodo DT-72 — esta parte é LEITURA. A resolução do ciclo é a 1.10C-B, e
 *         depende de decisão arquitetural que a implementação não deve inferir
 *
 * Por que existe: desde o PP-03C a paciente discorda e corrige por conta
 * própria, e o Curador só descobria isso rolando a lista inteira do Protocolo
 * até topar com um estado diferente. Uma discordância no fim da lista podia
 * atravessar a Curadoria sem ninguém ver — o produto passou a ouvi-la sem ter
 * onde escutá-la.
 *
 * A pendência NÃO é uma tabela nem um estado novo: é uma LEITURA de
 * `case_needs`. Duas condições, e nada além delas — houve tradução de alguém,
 * e ela se manifestou contra. Materializar isso em coluna criaria uma segunda
 * verdade para sincronizar; derivar não cria nada.
 *
 * `audit_logs` não entra aqui. A trilha é evidência de que o ato aconteceu,
 * não fonte do que é verdade agora — usá-la como fonte faria a tela do Curador
 * depender de um registro que existe para auditar, não para operar.
 *
 * Puro: sem React, sem banco.
 */

/** A ordem em que o Curador precisa ver, e por quê. */
export const PRIORIDADE_DA_REVISAO = ["RECUSADA", "CORRIGIDA"] as const;

export type DesfechoQueExigeRevisao = (typeof PRIORIDADE_DA_REVISAO)[number];

export type RespostaQueExigeRevisao = {
  subcriterionCode: string;
  /** O rótulo da pergunta, para ele reconhecer o conceito sem decorar código. */
  pergunta: string;
  desfecho: DesfechoQueExigeRevisao;
  /** A leitura DELE, que ela contestou. */
  leituraProposta: string | null;
  /**
   * O texto DELA, inteiro. Nunca resumido, nunca parafraseado (A2): resumir a
   * discordância é a mesma classe de erro que o Item 1.10 existe para corrigir
   * — alguém entre a fala dela e quem precisa lê-la.
   */
  texto: string;
};

const ORDEM_DO_PROTOCOLO = new Map(
  PERSON_PROTOCOL.map((pergunta, indice) => [pergunta.subcriterionCode, indice]),
);

const PERGUNTA_POR_CODIGO = new Map(
  PERSON_PROTOCOL.map((pergunta) => [pergunta.subcriterionCode, pergunta.question]),
);

/**
 * Só se manifesta contra a tradução quem teve uma tradução para contestar.
 *
 * `PENDENTE` NUNCA entra (A4): é a AUSÊNCIA de ato. Tratá-lo como pendência do
 * Curador transformaria o silêncio dela numa cobrança a ele, e faria o produto
 * afirmar que ela disse algo que ela não disse (I-8).
 *
 * `RECONHECIDA` também não entra: ela concordou, e concordância não exige
 * revisão de ninguém.
 */
function exigeRevisao(need: CaseNeedRecord): boolean {
  return (
    need.origin === "TRADUCAO" &&
    (PRIORIDADE_DA_REVISAO as readonly string[]).includes(need.acknowledgment)
  );
}

/**
 * As respostas que exigem revisão, na ordem em que ele precisa vê-las.
 *
 * `RECUSADA` antes de `CORRIGIDA` porque as duas dizem coisas diferentes:
 * corrigir é "quase, ajuste isto"; recusar é "não foi isso que eu disse". A
 * segunda desfaz a leitura inteira, e chegar a ela depois de trinta linhas de
 * lista é chegar tarde.
 *
 * Dentro de cada grupo, a ordem do Protocolo — a mesma em que a conversa
 * aconteceu, para ele reencontrar o ponto sem procurar.
 */
export function respostasQueExigemRevisao(
  needs: readonly CaseNeedRecord[],
): RespostaQueExigeRevisao[] {
  return needs
    .filter(exigeRevisao)
    .map((need) => ({
      subcriterionCode: need.subcriterionCode,
      pergunta: PERGUNTA_POR_CODIGO.get(need.subcriterionCode) ?? need.subcriterionCode,
      desfecho: need.acknowledgment as DesfechoQueExigeRevisao,
      leituraProposta: need.proposedReading,
      // O CHECK do banco e o DT-22 garantem o texto nos dois desfechos; se um
      // registro antigo vier sem ele, a tela diz isso em vez de mostrar vazio.
      texto: need.correction ?? "",
    }))
    .sort((a, b) => {
      const porDesfecho =
        PRIORIDADE_DA_REVISAO.indexOf(a.desfecho) - PRIORIDADE_DA_REVISAO.indexOf(b.desfecho);
      if (porDesfecho !== 0) return porDesfecho;

      return (
        (ORDEM_DO_PROTOCOLO.get(a.subcriterionCode) ?? Number.MAX_SAFE_INTEGER) -
        (ORDEM_DO_PROTOCOLO.get(b.subcriterionCode) ?? Number.MAX_SAFE_INTEGER)
      );
    });
}

/**
 * A lista do Protocolo com as que exigem revisão à frente (A1).
 *
 * O universo não muda — nenhuma pergunta some do painel dele. O que muda é a
 * ordem: o que ela contestou sobe, o resto segue na ordem da conversa.
 */
export function ordenarPelaRevisao<T extends { subcriterionCode: string }>(
  perguntas: readonly T[],
  needs: readonly CaseNeedRecord[],
): T[] {
  const prioridade = new Map(
    respostasQueExigemRevisao(needs).map((resposta, indice) => [
      resposta.subcriterionCode,
      indice,
    ]),
  );

  return [...perguntas].sort((a, b) => {
    const pa = prioridade.get(a.subcriterionCode);
    const pb = prioridade.get(b.subcriterionCode);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return 0; // empate preserva a ordem recebida — a do Protocolo
  });
}

/** Dito por extenso quando não há nada a revisar (A5) — nunca um bloco vazio. */
export const NADA_A_REVISAR = "Nenhuma resposta da paciente exige revisão neste momento.";

/**
 * M1 — QUANTAS SÃO, DITO NO TÍTULO.
 *
 * A Verificação apontou que o bloco mostrava a lista sem dizer o tamanho: com
 * uma resposta ou com seis, o Curador só descobria contando. O número é
 * derivado de `revisao.length` na renderização — nenhum estado, nada
 * persistido, nada para sincronizar.
 */
export function quantasExigemRevisao(total: number): string {
  if (total === 0) return NADA_A_REVISAR;
  return total === 1
    ? "1 resposta da paciente exige revisão"
    : `${total} respostas da paciente exigem revisão`;
}

/**
 * M2 — O QUE ELE PODE FAZER COM ISTO HOJE: LER.
 *
 * Sem esta frase, a ausência de botão parece defeito da tela — e um Curador
 * diante de uma discordância sem caminho tende a resolver por fora, editando
 * a tradução ou pedindo a alguém que "corrija" o registro dela. Qualquer um
 * dos dois desfaz o ato da paciente, que é justamente o que o PP-03 devolveu
 * a ela.
 *
 * Diz quatro coisas e nada além: o retorno é real, ainda não há fluxo de
 * resolução, ele não deve reescrever o que ela registrou, e a ausência de
 * botão é deliberada. Sem prazo prometido, sem vocabulário interno.
 */
export const RESOLUCAO_INDISPONIVEL =
  "Este retorno é real e veio dela. Ainda não existe, aqui, um caminho para resolvê-lo — " +
  "por isso não há botão nesta tela, e a falta dele é intencional. Converse com a paciente " +
  "quando for o caso, mas não reescreva o que ela registrou.";

export const ROTULO_DO_DESFECHO: Record<DesfechoQueExigeRevisao, string> = {
  RECUSADA: "Ela discordou desta leitura",
  CORRIGIDA: "Ela corrigiu esta leitura",
};
