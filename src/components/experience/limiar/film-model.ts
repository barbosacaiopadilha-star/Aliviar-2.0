import { STAGE_MS } from "./stage-tokens";

export { FILM_CONSOLIDATION_LINE } from "./continuation-model";

/** Transição entre o gesto e o início visível do filme (ms). */
export const FILM_OPENING_MS = STAGE_MS.filmOpening;

/** Silêncio de assimilação após o filme terminar (ms). */
export const FILM_ASSIMILATION_MS = STAGE_MS.filmAssimilation;

export const FILM_DEFAULT_SRC = "/film/aliviar.mp4";

export function resolveFilmSrc(envSrc?: string): string {
  const trimmed = envSrc?.trim();
  return trimmed || FILM_DEFAULT_SRC;
}
