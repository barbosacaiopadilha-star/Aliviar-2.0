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
    scene: "/scenes/recepcao-bright.jpg",
    tone: "ACOLHIMENTO",
    sensation: "Acolhimento",
    message: "Estamos começando a conhecer sua história.",
    sceneDescription: "A recepção da Aliviar em luz de manhã — o lugar de chegada.",
  },
  PERFIL_DE_PRIORIDADES: {
    scene: "/scenes/cena-5-quadro-planta.jpg",
    tone: "CONHECIMENTO",
    sensation: "Conhecimento",
    message: "Estamos entendendo o que é importante para você.",
    sceneDescription: "Uma sala de leitura com luz natural, madeira e papel organizado.",
  },
  CURADORIA: {
    scene: "/scenes/cena-6-detalhe.jpg",
    tone: "TRABALHO",
    sensation: "Equipe trabalhando",
    message: "Nossa equipe está analisando cuidadosamente o seu caso.",
    sceneDescription: "Uma mesa de trabalho sob luz focada, com documentos abertos.",
  },
  DOSSIE: {
    scene: "/scenes/grand-finale.jpg",
    tone: "CLAREZA",
    sensation: "Clareza",
    message: "Conseguimos organizar tudo para você.",
    sceneDescription: "Um ambiente amplo e aberto, com luz natural entrando por inteiro.",
  },
  REUNIAO: {
    scene: "/scenes/cena-2-recepcao-proxima.jpg",
    tone: "CONVERSA",
    sensation: "Conversa",
    message: "Agora vamos conhecer os caminhos encontrados.",
    sceneDescription: "Poltronas em volta de uma mesa baixa, preparadas para uma conversa.",
  },
  ESCOLHA: {
    scene: "/scenes/cena-4-transicao.jpg",
    tone: "CONVERSA",
    sensation: "Conversa",
    message: "Agora vamos conhecer os caminhos encontrados.",
    sceneDescription: "Uma passagem de luz suave entre dois ambientes.",
  },
  ACOMPANHAMENTO: {
    scene: "/scenes/cena-3-corredor.jpg",
    tone: "CONTINUIDADE",
    sensation: "Continuidade",
    message: "Seguimos ao seu lado durante a próxima etapa da sua jornada.",
    sceneDescription: "Um corredor claro que segue adiante, com vista para fora.",
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
