import type { ReportLifecycle } from "./relatorio-assistido";
import {
  composicaoPendenteDoCurador,
  pendenciasDeJuizoRelacional,
} from "./relatorio-inteligente";

/**
 * PRONTIDÃO PARA EMISSÃO — o Curador sabe o que falta ANTES de tentar emitir.
 *
 * @metodo Arquitetura §17.3 O3 — "O Curador sabe o que falta antes de tentar emitir"
 * @metodo ADR-064 — as guardas de emissão, que este módulo consome e nunca reescreve
 *
 * Por que existe: até aqui, o que impediria a emissão só aparecia **na** emissão,
 * como erro (achado G6). Pior: a tela do Relatório tinha a sua própria noção de
 * "composição escrita" — um `trim()` que dizia "está escrita" justamente quando o
 * texto ainda era a frase de trabalho do rascunho, isto é, exatamente o caso que
 * a emissão recusa. Duas interpretações da mesma prontidão, divergindo em
 * silêncio.
 *
 * O que este módulo NUNCA faz: decidir. Ele não sabe o que torna uma composição
 * pendente nem o que caracteriza juízo relacional em aberto — **pergunta às
 * mesmas funções que a emissão pergunta**, na mesma ordem, e apenas organiza a
 * resposta para leitura humana. Se uma guarda mudar, o painel muda junto, sem
 * ninguém precisar lembrar de atualizá-lo.
 *
 * Puro e determinístico: sem React, sem banco.
 */

export type BloqueioDeEmissaoId =
  | "RELATORIO_INEXISTENTE"
  | "COMPOSICAO_AUSENTE"
  | "COMPOSICAO_DO_SISTEMA"
  | "JUIZO_RELACIONAL_PENDENTE";

export type BloqueioDeEmissao = {
  id: BloqueioDeEmissaoId;
  /** O que falta, em uma frase. */
  oQueFalta: string;
  /** Por que falta — nunca uma regra nova, sempre a razão da guarda. */
  porQue: string;
};

export type ProntidaoParaEmissao = {
  /** Verdadeiro quando nenhuma guarda de emissão bloquearia agora. */
  pronto: boolean;
  /** O Relatório já foi emitido — não há o que preparar. */
  jaEmitido: boolean;
  /** Na mesma ordem em que a emissão os encontraria. */
  bloqueios: BloqueioDeEmissao[];
};

export type EntradaDeProntidao = {
  /**
   * O ciclo de vida do Relatório, lido por `getReportLifecycle`. `null` = o
   * Relatório ainda não existe — o primeiro bloqueio da emissão.
   */
  lifecycle: ReportLifecycle | null;
  compositionRationale: string | null;
  options: readonly { professionalProfileId: string; relationalReading: string | null }[];
};

/**
 * A mesma sequência de `emitReportAction`: existe Relatório? a abertura é do
 * Curador? sobrou juízo relacional pendente? A ordem importa — é ela que o
 * Curador encontraria ao tentar emitir.
 */
export function prontidaoParaEmissao(entrada: EntradaDeProntidao): ProntidaoParaEmissao {
  const bloqueios: BloqueioDeEmissao[] = [];
  const jaEmitido = Boolean(entrada.lifecycle?.emittedAt);

  if (!entrada.lifecycle) {
    bloqueios.push({
      id: "RELATORIO_INEXISTENTE",
      oQueFalta: "Escrever o Relatório.",
      porQue: "Não há documento para emitir — ele começa a existir quando você o escreve ou gera.",
    });
    return { pronto: false, jaEmitido, bloqueios };
  }

  // Guarda B-2 (ADR-064), consultada — não reimplementada.
  const composicao = composicaoPendenteDoCurador(entrada.compositionRationale);
  if (composicao === "AUSENTE") {
    bloqueios.push({
      id: "COMPOSICAO_AUSENTE",
      oQueFalta: "A abertura: por que estas três, juntas.",
      porQue: "É a primeira coisa que ela lê, e ainda não foi escrita.",
    });
  } else if (composicao === "DO_SISTEMA") {
    bloqueios.push({
      id: "COMPOSICAO_DO_SISTEMA",
      oQueFalta: "A abertura na sua voz — a que está lá é a do rascunho.",
      porQue:
        "O texto atual fala com você (“Revisão do Curador pendente”), não com a paciente.",
    });
  }

  // Guarda B-1 (ADR-064), consultada — não reimplementada.
  const pendencias = pendenciasDeJuizoRelacional(entrada.options);
  if (pendencias.length > 0) {
    const conceitos = [...new Set(pendencias.map((pendencia) => pendencia.conceito))].join("; ");
    bloqueios.push({
      id: "JUIZO_RELACIONAL_PENDENTE",
      oQueFalta: `A sua leitura relacional sobre ${conceitos} — ${pendencias.length} ponto${
        pendencias.length === 1 ? "" : "s"
      }.`,
      porQue:
        "O documento que ela relê sozinha não pode prometer uma conversa que não virá.",
    });
  }

  return { pronto: bloqueios.length === 0, jaEmitido, bloqueios };
}
