/**
 * O QUE CADA CANDIDATO RESPONDE AO QUE ELA PEDIU — o resumo antes da escolha.
 *
 * @metodo ADR-093 — a Mesa é o documento que ela vai ler, sendo escrito
 * @metodo ADR-041 — contagens, nunca notas: aqui também
 * @metodo ADR-042 — a seleção carrega quem, por quê e a que custo
 *
 * A seleção dos três é o ato em que a Curadoria vira produto. O contrato exige
 * uma razão escrita por opção e uma razão da composição — por que ESTES três,
 * juntos, fazem sentido para esta pessoa.
 *
 * Escrever isso do zero, olhando uma matriz de 29 linhas, é o que faz o texto
 * sair genérico. Este módulo resume o que já foi declarado, do lado dela: entre
 * as coisas que ela chamou de essenciais, quantas cada candidato responde,
 * quantas ele não responde, e quantas ninguém sabe.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * O QUE ELE NÃO FAZ, E NUNCA DEVE FAZER
 *
 * Não ordena, não pontua, não recomenda, não diz qual é melhor. Devolve
 * contagens e os nomes por trás delas — exatamente como o Motor, e pela mesma
 * razão: o dia em que a tela oferecer um ranking, o Curador vai confirmá-lo, e
 * a Aliviar terá passado a escolher o médico.
 *
 * A ordem em que os candidatos saem daqui é a ordem em que entraram. Ordenar
 * por qualquer contagem seria ranquear com outro nome.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import type { Linha, MesaPorPreocupacoes } from "./mesa-por-preocupacoes";
import type { NeedDegree } from "./protocolos";

/** O que um candidato responde a UM grupo de peso declarado por ela. */
export type ContagemPorPeso = {
  atende: number;
  naoAtende: number;
  semInformacao: number;
  /** As frases dela que ele atende — para a razão escrita citar, não resumir. */
  frasesQueAtende: readonly string[];
  /** As que ele não atende: é o que a razão precisa encarar, não esconder. */
  frasesQueNaoAtende: readonly string[];
};

export type ResumoDoCandidato = {
  profissionalId: string;
  nome: string;
  /** Só o que ela declarou como essencial — o resto pesa menos por decisão dela. */
  essenciais: ContagemPorPeso;
  /** Tudo que ela declarou, em qualquer grau. */
  tudo: ContagemPorPeso;
};

const VAZIA: ContagemPorPeso = {
  atende: 0,
  naoAtende: 0,
  semInformacao: 0,
  frasesQueAtende: [],
  frasesQueNaoAtende: [],
};

function somar(
  contagem: ContagemPorPeso,
  resultado: "ATENDE" | "NAO_ATENDE" | "SEM_INFORMACAO",
  frase: string,
): ContagemPorPeso {
  if (resultado === "ATENDE") {
    return {
      ...contagem,
      atende: contagem.atende + 1,
      frasesQueAtende: [...contagem.frasesQueAtende, frase],
    };
  }
  if (resultado === "NAO_ATENDE") {
    return {
      ...contagem,
      naoAtende: contagem.naoAtende + 1,
      frasesQueNaoAtende: [...contagem.frasesQueNaoAtende, frase],
    };
  }
  return { ...contagem, semInformacao: contagem.semInformacao + 1 };
}

/**
 * A leitura de UMA célula, do ponto de vista dela.
 *
 * `MEDIA_COMPATIBILIDADE` conta como "não atende" de propósito, e isso merece
 * explicação: no Motor, média é o que sai quando o profissional NÃO tem a
 * característica (princípio 2 da ADR-041 — ausência nunca elimina e nunca vira
 * alta). Contá-la como meio-atendimento suavizaria, para quem escreve a razão,
 * exatamente o que ela precisa saber antes de escolher.
 */
function lerCelula(
  compatibilidade: string | null,
  motivo: string,
): "ATENDE" | "NAO_ATENDE" | "SEM_INFORMACAO" {
  if (motivo !== "CRUZADO") return "SEM_INFORMACAO";
  if (compatibilidade === "ALTA_COMPATIBILIDADE") return "ATENDE";
  if (compatibilidade === "MEDIA_COMPATIBILIDADE") return "NAO_ATENDE";
  return "SEM_INFORMACAO";
}

/** A frase que dá nome à linha — a dela quando existe, a pergunta quando não. */
function fraseDaLinha(linha: Linha): string {
  return linha.resposta ?? linha.pergunta;
}

const PESOS_ESSENCIAIS: readonly NeedDegree[] = ["ESSENCIAL"];

export function resumirCandidatos(
  mesa: Pick<MesaPorPreocupacoes, "linhas"> & {
    profissionais: readonly { id: string; nome: string }[];
  },
): readonly ResumoDoCandidato[] {
  return mesa.profissionais.map((profissional) => {
    let essenciais = VAZIA;
    let tudo = VAZIA;

    for (const linha of mesa.linhas) {
      // Linha sem resposta dela não conta para nenhum lado: contá-la como
      // lacuna do PROFISSIONAL culparia o médico por uma pergunta que a
      // operação ainda não fez.
      if (linha.resposta === null || linha.grau === null) continue;

      const celula = linha.celulas.find((c) => c.profissionalId === profissional.id);
      if (!celula) continue;

      const leitura = lerCelula(celula.compatibilidade, celula.motivo);
      const frase = fraseDaLinha(linha);

      tudo = somar(tudo, leitura, frase);
      if (PESOS_ESSENCIAIS.includes(linha.grau)) {
        essenciais = somar(essenciais, leitura, frase);
      }
    }

    return { profissionalId: profissional.id, nome: profissional.nome, essenciais, tudo };
  });
}

// ---------------------------------------------------------------------------
// As sugestões de razão
// ---------------------------------------------------------------------------

export type RazaoSugerida = { rotulo: string; texto: string };

function lista(itens: readonly string[]): string {
  const limpos = itens.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (limpos.length === 0) return "";
  if (limpos.length === 1) return limpos[0];
  return `${limpos.slice(0, -1).join(", ")} e ${limpos[limpos.length - 1]}`;
}

/**
 * Começos de razão montados do que foi declarado — nunca de opinião.
 *
 * A diferença com o juízo é real: lá a conclusão é do Curador SOBRE um médico,
 * e sugerir frase seria o software opinando. Aqui a razão explica uma escolha
 * a partir de fatos que já estão na tela, e resumir fato não é opinar.
 *
 * A segunda sugestão existe porque a primeira é a fácil. Uma razão que só
 * enumera acertos esconde o custo, e o contrato da seleção tem `tradeOff`
 * justamente porque nenhuma das três opções é perfeita.
 */
export function razoesSugeridas(resumo: ResumoDoCandidato): readonly RazaoSugerida[] {
  const sugestoes: RazaoSugerida[] = [];

  if (resumo.essenciais.frasesQueAtende.length > 0) {
    sugestoes.push({
      rotulo: "Pelo que ela chamou de essencial",
      texto:
        `Está aqui porque responde ao que ela chamou de essencial em ` +
        `${resumo.essenciais.atende} de ${resumo.essenciais.atende + resumo.essenciais.naoAtende + resumo.essenciais.semInformacao} pontos: ` +
        `${lista(resumo.essenciais.frasesQueAtende)}.`,
    });
  }

  if (resumo.essenciais.frasesQueNaoAtende.length > 0) {
    sugestoes.push({
      rotulo: "Com o custo à vista",
      texto:
        `Está aqui apesar de não responder a ${lista(resumo.essenciais.frasesQueNaoAtende)}, ` +
        `que ela declarou essencial. O que compensa isso é `,
    });
  }

  if (resumo.essenciais.semInformacao > 0) {
    sugestoes.push({
      rotulo: "Com a lacuna nomeada",
      texto:
        `Está aqui com ${resumo.essenciais.semInformacao} ponto(s) essencial(is) que ninguém ` +
        `verificou sobre ele. Escolhi mesmo assim porque `,
    });
  }

  return sugestoes;
}
