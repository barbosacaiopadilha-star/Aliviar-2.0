/**
 * ATALHOS DA MESA — as mãos ficam no teclado.
 *
 * O Curador trabalha horas na mesma tela, repetindo os mesmos quatro
 * movimentos: trocar de etapa, trocar de profissional, abrir o detalhe,
 * comparar. Cada um deles custava um deslocamento de mouse e dois cliques.
 *
 * REGRA QUE NÃO SE NEGOCIA: nenhum atalho executa ato irreversível. Gerar,
 * aprovar e emitir o Relatório continuam sendo clique deliberado, na etapa
 * própria — uma tecla encostada não emite um documento para um paciente. Os
 * atalhos levam até lá; o ato é dele, com a mão, olhando.
 *
 * Puro: só a tabela e a resolução de tecla. O efeito é de quem chama.
 */

import type { MesaEtapaId } from "./mesa-etapas";

export type MesaAcao =
  | "ETAPA_PROXIMA"
  | "ETAPA_ANTERIOR"
  | "PROFISSIONAL_PROXIMO"
  | "PROFISSIONAL_ANTERIOR"
  | "ABRIR_DETALHES"
  | "IR_COMPARACAO"
  | "IR_RELATORIO"
  | "FILTROS"
  | "AJUDA"
  | "FECHAR";

export type Atalho = {
  acao: MesaAcao;
  /** Teclas que disparam a ação. */
  teclas: string[];
  /** Como aparece na ajuda rápida. */
  legenda: string;
  descricao: string;
  /** Ações que apenas levam a algum lugar — nunca alteram o Case. */
  navegacao: boolean;
};

export const MESA_ATALHOS: Atalho[] = [
  {
    acao: "ETAPA_PROXIMA",
    teclas: ["]", "n"],
    legenda: "] ou N",
    descricao: "Próxima etapa da investigação",
    navegacao: true,
  },
  {
    acao: "ETAPA_ANTERIOR",
    teclas: ["[", "p"],
    legenda: "[ ou P",
    descricao: "Etapa anterior",
    navegacao: true,
  },
  {
    acao: "PROFISSIONAL_PROXIMO",
    teclas: ["j"],
    legenda: "J",
    descricao: "Próximo profissional",
    navegacao: true,
  },
  {
    acao: "PROFISSIONAL_ANTERIOR",
    teclas: ["k"],
    legenda: "K",
    descricao: "Profissional anterior",
    navegacao: true,
  },
  {
    acao: "ABRIR_DETALHES",
    teclas: ["o"],
    legenda: "O",
    descricao: "Abrir os detalhes do profissional em foco",
    navegacao: true,
  },
  {
    acao: "IR_COMPARACAO",
    teclas: ["c"],
    legenda: "C",
    descricao: "Ir para a comparação",
    navegacao: true,
  },
  {
    acao: "IR_RELATORIO",
    teclas: ["r"],
    legenda: "R",
    descricao: "Ir para o Relatório — gerar, aprovar e emitir continuam por clique",
    navegacao: true,
  },
  {
    acao: "FILTROS",
    teclas: ["f"],
    legenda: "F",
    descricao: "Focar os filtros rápidos",
    navegacao: true,
  },
  {
    acao: "AJUDA",
    teclas: ["?"],
    legenda: "?",
    descricao: "Mostrar esta ajuda",
    navegacao: true,
  },
  {
    acao: "FECHAR",
    teclas: ["Escape"],
    legenda: "Esc",
    descricao: "Fechar o que estiver aberto",
    navegacao: true,
  },
];

/** Para onde cada atalho de destino leva. */
export const ATALHO_DESTINO: Partial<Record<MesaAcao, MesaEtapaId>> = {
  IR_COMPARACAO: "COMPATIBILIDADE",
  IR_RELATORIO: "RELATORIO",
};

/**
 * Resolve a tecla. Modificador presente devolve `null`: Ctrl+C é do sistema
 * operacional, não da Mesa.
 */
export function acaoDaTecla(
  key: string,
  modificadores: { ctrl?: boolean; meta?: boolean; alt?: boolean } = {},
): MesaAcao | null {
  if (modificadores.ctrl || modificadores.meta || modificadores.alt) return null;
  const atalho = MESA_ATALHOS.find((entrada) => entrada.teclas.includes(key));
  return atalho?.acao ?? null;
}

/**
 * O atalho não pode roubar a tecla de quem está escrevendo. Um `j` digitado
 * numa evidência é a letra J, não "próximo profissional".
 */
export function ehCampoDeTexto(elemento: EventTarget | null): boolean {
  if (!elemento || typeof (elemento as HTMLElement).tagName !== "string") return false;
  const alvo = elemento as HTMLElement;
  if (alvo.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
}
