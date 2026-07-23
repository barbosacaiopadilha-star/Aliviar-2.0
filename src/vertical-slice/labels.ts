import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import type { PublicChapter } from "@/journey-handoff";

export const OPERATIONAL_STAGE_LABELS: Record<OperationalStage, string> = {
  CADASTRO: "Cadastro",
  HISTORIA: "Compartilhando sua história",
  ACE: "Análise inicial",
  CURADORIA: "Curadoria",
  ENTREGA: "Entrega",
  ESCOLHA: "Escolha",
  ACOMPANHAMENTO: "Acompanhamento",
  RELACIONAMENTO: "Relacionamento",
  ENCERRADO: "Jornada encerrada",
};

/** Textos da confirmação narrativa após compartilhamento — sem linguagem de protocolo. */
export const HISTORIA_RECEBIDA_COPY = {
  headline: "Nós recebemos sua história",
  narrative: "Agora conseguimos compreender melhor a sua história.",
  continuation:
    "Vamos cuidar do que você trouxe com o mesmo cuidado com que você compartilhou. Quando quiser, você pode continuar pelo portal.",
  curadoriaSignal: "Novo contexto disponível.",
  curadoriaBody: "O paciente trouxe novos elementos para a curadoria compreender sua história.",
  portalComprehension: "Agora conseguimos compreender melhor a sua história.",
  curadoriaComprehension: "Agora conseguimos compreender melhor a história deste paciente.",
} as const;

export const STORY_RECEPTION_PORTAL_TITLE = HISTORIA_RECEBIDA_COPY.headline;
export const STORY_RECEPTION_CURADORIA_TITLE = HISTORIA_RECEBIDA_COPY.curadoriaSignal;

/** Percepção de evolução quando a curadoria inicia — sem prazos nem progresso artificial. */
export const CURADORIA_COMECOU_COPY = {
  headline: "A curadoria começou",
  narrative: "Seu caso agora está sendo analisado.",
  continuation:
    "Estamos reunindo tudo que você compartilhou para compreender sua história com cuidado. Você pode voltar ao portal quando quiser.",
  portalEvolution: "Seu caso agora está sendo analisado.",
  curadoriaAbertura: "Caso pronto para análise.",
  curadoriaBody:
    "Contexto consolidado e histórico recebido. A curadoria pode iniciar a análise do caso.",
} as const;

export const CURADORIA_STARTED_PORTAL_TITLE = CURADORIA_COMECOU_COPY.headline;
export const CURADORIA_READY_TITLE = CURADORIA_COMECOU_COPY.curadoriaAbertura;

export const PUBLIC_CHAPTER_LABELS: Record<PublicChapter, string> = {
  LIMIAR_THRESHOLD: "Primeiro acolhimento",
  LIMIAR_FILM: "O filme",
  LIMIAR_CONTINUATION: "O que ficou com você",
  LIMIAR_CRAFT: "O ofício",
  LIMIAR_PATH: "O caminho",
  LIMIAR_INVITE: "O convite",
  LIMIAR_FAREWELL: "A luz acesa",
  CONVERSA_GREETING: "Início da conversa",
  CONVERSA_ASK_NAME: "Como te chamar",
  CONVERSA_ASK_STORY: "Contando sua história",
  CONVERSA_ASK_DURATION: "O tempo que você carrega isso",
  CONVERSA_CLOSING: "Fechando a conversa",
};
