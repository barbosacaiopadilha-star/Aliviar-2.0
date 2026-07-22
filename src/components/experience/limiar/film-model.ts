/** Transição entre o gesto e o início visível do filme (ms). */
export const FILM_OPENING_MS = 1800;

/** Silêncio de assimilação após o filme terminar (ms). */
export const FILM_ASSIMILATION_MS = 4800;

/**
 * Uma linha após o respiro — nomeia o que ficou, sem repetir o filme.
 */
export const FILM_CONSOLIDATION_LINE = "Isso fica com você.";

export const FILM_DEFAULT_SRC = "/film/aliviar.mp4";

export function resolveFilmSrc(envSrc?: string): string {
  const trimmed = envSrc?.trim();
  return trimmed || FILM_DEFAULT_SRC;
}
