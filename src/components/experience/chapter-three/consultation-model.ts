export type ConsultationTurn =
  | "greeting"
  | "ask-tried"
  | "ask-open"
  | "confirm"
  | "closing";

export type ConsultationMessage = {
  from: "marina" | "patient";
  text: string;
};

export const CONSULTATION_HOST = "Dra. Marina";
export const JOURNEY_MANAGER = "Lucas";

const PAUSE_MS = 1100;
const BREATH_MS = 750;

export function consultationPauseMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : PAUSE_MS;
}

export function consultationBreathMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : BREATH_MS;
}

export function buildWelcomeLines(): string[] {
  return [
    "Que bom que você veio.",
    "Sou a Dra. Marina, médica da equipe Aliviar.",
    "A Ana me contou que vocês conversaram. Li com atenção.",
    "Este é o espaço da consulta inicial — um encontro para compreender seu caso com profundidade.",
  ];
}

export function buildPreparationLines(): string[] {
  return [
    "Não é um questionário nem uma triagem.",
    "É um momento de escuta, com tempo e calma.",
    "Quando nos encontrarmos por vídeo ou voz, já vou conhecer um pouco do que você vive.",
  ];
}

export function buildTriedIntroLines(): string[] {
  return [
    "Antes de mais nada, quero entender o caminho que você já percorreu.",
    "O que você já tentou até aqui — consultas, exames, orientações?",
    "Pergunto para não repetir o que não funcionou e para honrar o que você já fez.",
  ];
}

export function buildTriedReflectionLines(): string[] {
  return ["Obrigada. Isso me ajuda a situar de onde você chega."];
}

export function buildOpenIntroLines(): string[] {
  return [
    "Agora me diga: o que ainda está mais em aberto para você?",
    "Pode ser uma dúvida, uma decisão, um medo — o que estiver pesando agora.",
  ];
}

export function buildOpenReflectionLines(): string[] {
  return [
    "Recebi o que você escreveu.",
    "Começo a compreender seu caso com mais clareza — não como um formulário, mas como uma história.",
  ];
}

export function buildSynthesisLines(): string[] {
  return [
    "A Aliviar pode caminhar com você: organizar o caminho, cuidar da curadoria e acompanhar sua jornada.",
    "Não somos clínica e não substituímos seu médico. Coordenamos a experiência ao seu lado.",
    `${JOURNEY_MANAGER}, da nossa equipe, será quem acompanha sua jornada daqui em diante — com rosto e nome.`,
  ];
}

export function buildConfirmIntroLines(): string[] {
  return [
    "Antes de combinarmos o encontro por vídeo ou voz, preciso saber:",
    "Você gostaria de seguir com a Aliviar?",
    "Sem pressa. Pode pensar com calma.",
  ];
}

export function buildConfirmYesLines(): string[] {
  return [
    "Fico feliz em saber.",
    "Quando estiver pronto para a consulta, é só me avisar — combinamos juntos, no seu ritmo.",
    "Até lá, estamos com você.",
  ];
}

export function buildConfirmPauseLines(): string[] {
  return [
    "Respeito totalmente.",
    "Quando quiser retomar, estarei aqui.",
    "Cuide-se.",
  ];
}

export function toMarinaMessages(lines: string[]): ConsultationMessage[] {
  return lines.map((text) => ({ from: "marina", text }));
}
