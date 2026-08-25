/**
 * O RASCUNHO DO RELATÓRIO — a tese da ADR-093 chegando ao fim dela.
 *
 * @metodo ADR-093 — a Mesa é o documento que ela vai ler, sendo escrito
 * @metodo ADR-042 — o relatório carrega quem, por quê, como conversa com os
 *         pesos dela, e o que custa
 * @metodo ADR-041 — contagens, nunca notas; nenhuma ordem sugerida
 *
 * O contrato do relatório pede três coisas por opção: a justificativa, a
 * RELAÇÃO COM OS PESOS que ela validou, e os pontos de atenção — "toda opção
 * precisa dizer o que custa".
 *
 * A Mesa antiga produzia a matriz e deixava o Curador traduzir aquilo em prosa
 * do zero, num editor separado. Era ali que o sentido se perdia: o texto saía
 * genérico porque a matéria-prima estava em outra tela, em outra linguagem.
 *
 * Aqui não há tradução. A Mesa nova já é a relação entre o que ela disse e o
 * que cada um responde — o rascunho só põe isso em frases.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O QUE ISTO NÃO É
 *
 * Não é o relatório. É rascunho oferecido, que o Curador aceita, corta ou
 * ignora — a ADR-068 nomeia a caixa pré-marcada entre as formas proibidas de
 * confirmação automática, e um relatório que se escreve sozinho é a mesma
 * coisa numa escala maior.
 *
 * E nada aqui é inventado: cada frase é feita das frases DELA e das contagens
 * do Motor. Se o rascunho acrescentasse conteúdo, ela leria, assinada pela
 * Aliviar, uma afirmação que ninguém verificou.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import type { ResumoDoCandidato } from "./composicao-dos-tres";

export type RascunhoDaOpcao = {
  profissionalId: string;
  /** Como esta opção conversa com o que ela declarou — o campo do contrato. */
  relationToWeights: string;
  /** O que custa. O contrato exige ao menos um, e por boa razão. */
  attentionPoints: readonly string[];
};

/**
 * A escolha dela, ENTRE ASPAS — e por que não pode ser de outro jeito.
 *
 * Os rótulos do Catálogo são escritos na primeira pessoa dela: "Preciso de
 * atendimento presencial", "Quero entender o suficiente para conseguir
 * escolher". Isso é certo como opção de resposta e desmonta dentro de uma
 * frase dirigida a ela: "Você disse que preciso de atendimento presencial era
 * essencial" mistura duas pessoas gramaticais na mesma oração.
 *
 * Só apareceu quando eu li a saída com o caso real — nenhum teste de tipo
 * pegaria isso, porque não é erro de tipo: é erro de português.
 *
 * As aspas resolvem e são mais honestas: aquilo é literalmente o que ela
 * escolheu, com as palavras que o Método ofereceu a ela.
 */
function lista(itens: readonly string[]): string {
  const limpos = itens.map((i) => i.trim()).filter(Boolean).map((i) => `“${i}”`);
  if (limpos.length === 0) return "";
  if (limpos.length === 1) return limpos[0];
  return `${limpos.slice(0, -1).join(", ")} e ${limpos[limpos.length - 1]}`;
}

/**
 * A relação com os pesos dela, em uma frase.
 *
 * Ela é escrita na SEGUNDA pessoa, porque quem vai ler é ela — e não o Curador
 * conferindo o próprio trabalho. "Você disse que precisava de X; este caminho
 * responde a isso" é uma frase para a pessoa; "atende ao subcritério
 * ACESSO_MODALIDADE" é uma frase para o sistema.
 */
function relacaoComOsPesos(resumo: ResumoDoCandidato): string {
  const { frasesQueAtende, frasesQueNaoAtende, semInformacao } = resumo.essenciais;

  const partes: string[] = [];

  if (frasesQueAtende.length > 0) {
    partes.push(
      `Você disse que era essencial: ${lista(frasesQueAtende)}. Este caminho responde a isso.`,
    );
  }

  if (frasesQueNaoAtende.length > 0) {
    // A frase do que NÃO atende vem junto, na mesma respiração. Separá-la em
    // outro parágrafo é como um relatório esconde o custo sem mentir.
    partes.push(
      `Você também disse que era essencial: ${lista(frasesQueNaoAtende)} — e aqui isso não se confirma.`,
    );
  }

  if (semInformacao > 0) {
    partes.push(
      `Sobre ${semInformacao === 1 ? "um ponto" : `${semInformacao} pontos`} que você chamou de essencial, não conseguimos verificar nada — e preferimos dizer isso a supor.`,
    );
  }

  if (partes.length === 0) {
    // Sem nada declarado por ela, não existe relação com peso nenhum. Dizer
    // isso é mais honesto do que produzir uma frase que soa completa.
    return "";
  }

  return partes.join(" ");
}

/**
 * Os pontos de atenção — o que ela perde escolhendo este.
 *
 * O contrato exige ao menos um por opção, e a razão é do Método: uma Curadoria
 * que apresenta três caminhos sem custo apresentou três propagandas.
 */
function pontosDeAtencao(resumo: ResumoDoCandidato): readonly string[] {
  const pontos: string[] = [];

  for (const frase of resumo.essenciais.frasesQueNaoAtende) {
    pontos.push(`Não se confirmou “${frase.trim()}” — que você disse ser essencial.`);
  }

  if (resumo.essenciais.semInformacao > 0) {
    pontos.push(
      `${resumo.essenciais.semInformacao === 1 ? "Um ponto essencial" : `${resumo.essenciais.semInformacao} pontos essenciais`} que ninguém verificou sobre este profissional.`,
    );
  }

  // Não inventamos um custo quando não há: devolver a lista vazia deixa o
  // campo obrigatório para o Curador, que é quem sabe o que a tela não viu.
  return pontos;
}

export function rascunharRelatorio(
  resumos: readonly ResumoDoCandidato[],
  escolhidos: readonly string[],
): readonly RascunhoDaOpcao[] {
  // A ordem é a dos ESCOLHIDOS — quem compôs decidiu em que ordem ela lê, e
  // reordenar aqui seria a tela opinando sobre a apresentação.
  return escolhidos
    .map((id) => resumos.find((r) => r.profissionalId === id))
    .filter((resumo): resumo is ResumoDoCandidato => Boolean(resumo))
    .map((resumo) => ({
      profissionalId: resumo.profissionalId,
      relationToWeights: relacaoComOsPesos(resumo),
      attentionPoints: pontosDeAtencao(resumo),
    }));
}
