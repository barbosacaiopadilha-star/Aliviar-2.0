/**
 * STORYTELLING AMBIENTAL — cada etapa da jornada tem a sua identidade.
 *
 * Não é decoração: é linguagem. A pessoa que abre a plataforma no meio da
 * Curadoria não deve sentir que entrou num sistema administrativo — deve
 * sentir que existe uma equipe cuidando do caso dela, e o ambiente é a
 * primeira coisa que diz isso, antes de qualquer texto.
 *
 * Módulo puro: sem React, sem banco. As cenas são fotografias reais dos
 * ambientes da Aliviar (`ALIVIAR_SCENES`), escolhidas pela sensação que cada
 * etapa precisa transmitir — não por estética avulsa.
 *
 * O que ele nunca faz: mudar o que a jornada diz. A etapa atual vem de
 * `jornada.ts`, a mensagem vem de `experiencia.ts`. Aqui mora só a atmosfera.
 */

import { ALIVIAR_SCENES } from "@/lib/aliviar-environments";
import type { JornadaStageId } from "@/modules/curadoria/jornada";

/** Como o ambiente se comporta — usado para escolher o tratamento visual. */
export type AmbienceTone =
  | "ACOLHIMENTO"
  | "CONHECIMENTO"
  | "TRABALHO"
  | "CLAREZA"
  | "CONVERSA"
  | "CONTINUIDADE";

export type StageAmbience = {
  /** Chave da cena real da Aliviar. */
  scene: string;
  /**
   * Enquadramento próprio, quando o padrão (`cover`, centrado) mostra algo que
   * não deveria ficar atrás do texto.
   *
   * Existe por um caso concreto: a recepção tem o **logotipo gravado na
   * parede**, e ele caía atrás de "Boa noite, ⟨nome⟩" — o logotipo da
   * fotografia disputando a linha com o nome de quem chegou. O lockup ocupa a
   * faixa de 34% a 62% da largura da imagem; recortar fora dela resolve sem
   * véu, sem blur e sem trocar de ambiente.
   *
   * Fica aqui, e não no CSS, porque o CSS vale para TODAS as etapas — e os
   * corredores não têm nada escrito. Apertar o enquadramento deles para
   * corrigir a recepção seria estragar seis cenas para consertar uma.
   */
  enquadramento?: { size: string; position: string };
  tone: AmbienceTone;
  /** A sensação que esta etapa precisa transmitir, em uma palavra. */
  sensation: string;
  /** O que o ambiente diz antes de qualquer texto — a frase do hero. */
  message: string;
  /** Descrição da cena para quem não a vê. Nunca decorativa: informa a etapa. */
  sceneDescription: string;
};

/**
 * A tabela inteira num lugar só, para que a identidade de cada etapa possa
 * ser lida de uma vez — e para que ninguém acrescente uma etapa sem decidir
 * como ela se parece.
 */
export const STAGE_AMBIENCES: Record<JornadaStageId, StageAmbience> = {
  CONSULTA_INICIAL: {
    scene: ALIVIAR_SCENES.recepcao,
    // 280% mostra os 36% da direita — a partir de 64%, com folga sobre o fim
    // do lockup (62%). O que aparece é balcão, luminária de cúpula, oliveira e
    // travertino: a mesma recepção, sem nada para ler.
    enquadramento: { size: "280% auto", position: "100% 42%" },
    tone: "ACOLHIMENTO",
    sensation: "Acolhimento",
    message: "Estamos começando a conhecer sua história.",
    sceneDescription: "A recepção da Aliviar, em travertino e luz quente — o lugar de chegada.",
  },
  PERFIL_DE_PRIORIDADES: {
    scene: ALIVIAR_SCENES.consultas,
    tone: "CONHECIMENTO",
    sensation: "Conhecimento",
    message: "Estamos entendendo o que é importante para você.",
    sceneDescription: "O corredor das consultas, com quadro em tons de verde e poltronas ao fundo.",
  },
  CURADORIA: {
    scene: ALIVIAR_SCENES.consultas,
    tone: "TRABALHO",
    sensation: "Curador trabalhando",
    message: "Seu Curador está analisando cuidadosamente o seu caso.",
    sceneDescription: "O corredor das consultas, em silêncio, com luz linear rente ao chão.",
  },
  DOSSIE: {
    scene: ALIVIAR_SCENES.despedida,
    tone: "CLAREZA",
    sensation: "Clareza",
    message: "Conseguimos organizar tudo para você.",
    sceneDescription: "Uma sala clara de saída, com poltrona, oliveiras e luz de fim de tarde.",
  },
  REUNIAO: {
    scene: ALIVIAR_SCENES.consultas,
    tone: "CONVERSA",
    sensation: "Conversa",
    message: "Agora vamos conhecer os caminhos encontrados.",
    sceneDescription: "Duas poltronas e uma mesa baixa ao fim do corredor, preparadas para conversar.",
  },
  ESCOLHA: {
    scene: ALIVIAR_SCENES.transicao,
    tone: "CONVERSA",
    sensation: "Conversa",
    message: "Agora vamos conhecer os caminhos encontrados.",
    sceneDescription: "O corredor de transição, com luz suave conduzindo de um ambiente ao outro.",
  },
  ACOMPANHAMENTO: {
    scene: ALIVIAR_SCENES.despedida,
    tone: "CONTINUIDADE",
    sensation: "Continuidade",
    message: "Seguimos ao seu lado durante a próxima etapa da sua jornada.",
    sceneDescription: "A sala de saída, clara e aberta, de onde o acompanhamento continua.",
  },
};

export function ambienceFor(stage: JornadaStageId): StageAmbience {
  return STAGE_AMBIENCES[stage];
}

/**
 * A saudação pelo horário. Sem exagero: "Bom dia" e o nome, nada de
 * comentário sobre o dia dela nem emoji.
 *
 * O corte da noite é às 18h e o da manhã às 5h — quem abre a plataforma às
 * 23h está acordado por algum motivo, e "boa noite" é a única coisa gentil a
 * dizer.
 */
export function greetingFor(hour: number): "Bom dia" | "Boa tarde" | "Boa noite" {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * A hora local de quem lê. O servidor não sabe o fuso da pessoa, e o cadastro
 * não guarda: usamos o fuso do Brasil, onde a Aliviar atende. Errar por uma
 * hora numa saudação é aceitável; um "Bom dia" às 22h não seria.
 */
export function currentHourInBrazil(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
}

/**
 * A saudação do hero. Uma ideia principal por tela: o nome de quem chegou e
 * onde a jornada dela está — nada mais.
 */
export function heroGreeting(firstName: string, stage: JornadaStageId): { title: string; subtitle: string } {
  const ambience = ambienceFor(stage);
  return {
    title: `Olá, ${firstName}.`,
    subtitle: ambience.message,
  };
}
