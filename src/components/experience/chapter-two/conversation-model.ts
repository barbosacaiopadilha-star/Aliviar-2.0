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

export function buildClosingMessages(preferredName: string): ConversationMessage[] {
  return [
    {
      from: "ana",
      text: `${preferredName}, obrigada por compartilhar. Li com atenção.`,
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
