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
