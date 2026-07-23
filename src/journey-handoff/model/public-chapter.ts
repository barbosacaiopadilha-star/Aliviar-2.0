/** Capítulo canônico da jornada pública (limiar + conversa). */
export type PublicChapter =
  | "LIMIAR_THRESHOLD"
  | "LIMIAR_FILM"
  | "LIMIAR_CONTINUATION"
  | "LIMIAR_CRAFT"
  | "LIMIAR_PATH"
  | "LIMIAR_INVITE"
  | "LIMIAR_FAREWELL"
  | "CONVERSA_GREETING"
  | "CONVERSA_ASK_NAME"
  | "CONVERSA_ASK_STORY"
  | "CONVERSA_ASK_DURATION"
  | "CONVERSA_CLOSING";

export const PUBLIC_CHAPTER_ORDER: readonly PublicChapter[] = [
  "LIMIAR_THRESHOLD",
  "LIMIAR_FILM",
  "LIMIAR_CONTINUATION",
  "LIMIAR_CRAFT",
  "LIMIAR_PATH",
  "LIMIAR_INVITE",
  "LIMIAR_FAREWELL",
  "CONVERSA_GREETING",
  "CONVERSA_ASK_NAME",
  "CONVERSA_ASK_STORY",
  "CONVERSA_ASK_DURATION",
  "CONVERSA_CLOSING",
] as const;

export function publicChapterIndex(chapter: PublicChapter): number {
  return PUBLIC_CHAPTER_ORDER.indexOf(chapter);
}

export function isPublicChapterAfter(a: PublicChapter, b: PublicChapter): boolean {
  return publicChapterIndex(a) > publicChapterIndex(b);
}
