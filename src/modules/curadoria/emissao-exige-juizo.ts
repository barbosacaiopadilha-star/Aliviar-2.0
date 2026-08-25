/**
 * O JUÍZO HUMANO É CONDIÇÃO DE EMISSÃO — ADR-094, saída A.
 *
 * @metodo ADR-094 — decidida pelo Fundador em 25/08
 * @metodo ADR-067 §5 — H8–H10 sempre exigidos; H11 quando o Case declarou grau
 * @metodo ADR-065 — condução de notícias difíceis exige cruzamento humano
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ESTE MÓDULO EXISTE
 *
 * O `SIM-51` encontrou uma Curadoria emitida e ENTREGUE a uma paciente com
 * zero juízos registrados, onde o Método exigia nove. Não foi regressão: nem
 * `validateMesaClosure` nem `emitReportAction` jamais os checaram. A regra
 * vivia no Método e nada no software a lia.
 *
 * A Curadoria Aliviar não vende lista de médicos — vende curadoria explicada e
 * validada por humano. O juízo é onde essa promessa se materializa. Sem ele, a
 * paciente recebe três nomes escolhidos por alguém que não registrou por quê,
 * e o Motor, que organiza e não escolhe, aparece como se tivesse escolhido.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * OS QUATRO RECORTES DA ADR-094, e cada um é uma recusa a exagerar
 *
 * 1. **Só os TRÊS SELECIONADOS.** Julgar quem não foi escolhido é trabalho que
 *    não chega à paciente. A Rede inteira não entra aqui.
 * 2. **Só os EXIGIDOS, não os oferecidos.** Três técnicos sempre; os
 *    relacionais apenas onde o Case declarou grau. A tela oferece seis pontos
 *    por profissional; o Método exige três ou seis, e é `lacunasDeJuizo` quem
 *    sabe a diferença — ela não é recalculada aqui.
 * 3. **Não existe "não informado" de juízo, e não vai passar a existir.** O
 *    equivalente honesto já está na tela: um dos sete começos oferecidos é
 *    *"o que sei até aqui não me permite concluir mais do que…"*. Juízo
 *    reservado é juízo. Ausência de juízo não é.
 * 4. **A frase nomeia quem e o quê.** "Faltam requisitos" faria o Curador
 *    caçar; e uma recusa que obriga a caçar é a recusa ensinando a contornar.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { CRITERION_LABELS, type CruzamentoCriterion } from "./cruzamento";
import { RELATIONAL_CONCEPTS_BY_CODE } from "./motor-relacional";
import type { LacunaDeJuizo } from "./julgamentos";

/** Um dos três selecionados, com o que o Método ainda espera dele. */
export type SelecionadoComLacunas = {
  professionalProfileId: string;
  nome: string;
  /** Vem de `lacunasDeJuizo` — este módulo nunca recalcula a exigência. */
  lacunas: readonly LacunaDeJuizo[];
};

export type VeredictoDaEmissao =
  | { pode: true }
  | { pode: false; motivo: string; faltando: readonly { nome: string; conceitos: readonly string[] }[] };

/**
 * O nome humano do conceito.
 *
 * Os técnicos são eixos e têm rótulo em `CRITERION_LABELS`; os relacionais têm
 * o próprio, no Catálogo. Nenhuma lista nova nasce aqui — uma segunda lista
 * divergiria da primeira em silêncio, e o `SIM-45` é a memória disso.
 */
export function rotuloDoConceito(subcriterionCode: string): string {
  const tecnico = CRITERION_LABELS[subcriterionCode as CruzamentoCriterion];
  if (tecnico) return tecnico;
  return RELATIONAL_CONCEPTS_BY_CODE.get(subcriterionCode)?.name ?? subcriterionCode;
}

/** "a, b e c" — a vírgula final vira "e", como gente escreve. */
function enumerar(itens: readonly string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/**
 * O Relatório pode ser emitido?
 *
 * Lista vazia de selecionados devolve `pode: false` de propósito: emitir sem
 * os três é outra falha, e ela já tem dono (`validateSelection`) — mas
 * devolver `pode: true` aqui seria esta guarda AFIRMANDO que está tudo certo
 * sobre um conjunto que ela não examinou. Guarda que aprova o vazio é guarda
 * que não guarda.
 */
export function veredictoDaEmissao(
  selecionados: readonly SelecionadoComLacunas[],
): VeredictoDaEmissao {
  if (selecionados.length === 0) {
    return {
      pode: false,
      motivo:
        "Não há três caminhos selecionados para emitir — e sem eles não há juízo a conferir.",
      faltando: [],
    };
  }

  const faltando = selecionados
    .filter((selecionado) => selecionado.lacunas.length > 0)
    .map((selecionado) => ({
      nome: selecionado.nome,
      conceitos: selecionado.lacunas.map((lacuna) => rotuloDoConceito(lacuna.subcriterionCode)),
    }));

  if (faltando.length === 0) return { pode: true };

  const porPessoa = faltando.map(({ nome, conceitos }) => `${nome} (${enumerar(conceitos)})`);

  return {
    pode: false,
    motivo:
      "O Relatório não pode ser emitido: falta o seu juízo sobre " +
      `${enumerar(porPessoa)}. ` +
      "A ADR-067 §5 exige o juízo humano de cada caminho que ela vai receber — " +
      "e se o que você sabe não permite concluir, isso também é juízo, e pode ser escrito assim.",
    faltando,
  };
}
