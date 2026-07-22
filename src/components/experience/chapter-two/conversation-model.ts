export type ConversationTurn =
  | "greeting"
  | "ask-name"
  | "ask-story"
  | "ask-duration"
  | "closing";

export type ConversationMessage = {
  from: "ana" | "patient";
  text: string;
};

export const CONVERSATION_HOST = "Ana";

const PAUSE_MS = 1100;
const BREATH_MS = 750;

export function conversationPauseMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : PAUSE_MS;
}

export function conversationBreathMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : BREATH_MS;
}

export function buildNameIntroLines(): string[] {
  return [
    "Antes de mais nada, quero saber como te chamar.",
    "Assim nossa conversa fica mais próxima — como quando falamos com alguém de confiança.",
    "Como posso te chamar?",
  ];
}

export function buildNameReflectionLines(displayName: string): string[] {
  return [`Prazer, ${displayName}.`, "Obrigada por se apresentar."];
}

export function buildStoryIntroLines(displayName: string): string[] {
  return [
    `Agora quero ouvir você, ${displayName}.`,
    "Me conte, com suas palavras, o que te trouxe até nós.",
    "Pergunto porque preciso entender seu contexto — não para classificar, mas para compreender.",
  ];
}

export function buildStoryReflectionLines(): string[] {
  return ["Obrigada por confiar isso a mim.", "Recebi o que você escreveu."];
}

export function buildDurationIntroLines(): string[] {
  return [
    "Só mais uma coisa, para eu situar melhor.",
    "Há quanto tempo você convive com isso?",
    "Se preferir deixar para depois, também está bem.",
  ];
}

export function buildDurationReflectionLines(answered: boolean): string[] {
  if (answered) {
    return ["Entendi. Isso ajuda a enxergar o tempo que você carrega isso."];
  }
  return ["Tudo bem. Respeito seu tempo — podemos voltar a isso quando fizer sentido."];
}

export function buildClosingMessages(preferredName: string): ConversationMessage[] {
  return [
    {
      from: "ana",
      text: `${preferredName}, obrigada por conversar comigo hoje.`,
    },
    {
      from: "ana",
      text: "O próximo passo é uma consulta inicial — um momento para aprofundarmos juntos, com mais calma e tempo.",
    },
    {
      from: "ana",
      text: "Quando estiver pronto, é só me avisar por aqui. Seguimos no seu ritmo.",
    },
  ];
}

export function preferredNameFrom(rawName: string): string {
  const trimmed = rawName.trim();
  return trimmed.length > 0 ? trimmed.split(/\s+/)[0]! : "você";
}

export function toAnaMessages(lines: string[]): ConversationMessage[] {
  return lines.map((text) => ({ from: "ana", text }));
}
