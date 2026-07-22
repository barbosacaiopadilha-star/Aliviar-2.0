import { STAGE_MS } from "./stage-tokens";

export type FilmContinuationLine = {
  text: string;
  delayMs: number;
};

/** Primeira linha após o respiro — nomeia o que ficou do filme. */
export const FILM_CONSOLIDATION_LINE = "Isso fica com você.";

/**
 * Continuação orgânica do filme — primeira camada de compreensão.
 * Quem são essas pessoas; não o que a Aliviar vende.
 */
export function buildFilmContinuationLines(): FilmContinuationLine[] {
  return [
    {
      text: FILM_CONSOLIDATION_LINE,
      delayMs: STAGE_MS.consolidationDelay,
    },
    {
      text: "Pessoas que escutam com calma.",
      delayMs: STAGE_MS.continuationLine2Delay,
    },
    {
      text: "Permanecem com você — não por você.",
      delayMs: STAGE_MS.continuationLine3Delay,
    },
  ];
}
