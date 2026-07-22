import { STAGE_MS } from "./stage-tokens";

export { FILM_CONSOLIDATION_LINE } from "./continuation-model";

/**
 * Vídeo institucional provisório aprovado (Aliviar 1.0).
 * Substituir o arquivo em `public/film/aliviar.mp4` quando o filme F02 estiver pronto.
 * O conteúdo do vídeo não é alterado pela experiência — apenas integrado.
 */
export const FILM_PROVISIONAL_ASSET = "aliviar-1.0";

/** Transição entre o gesto e o início visível do filme (ms). */
export const FILM_OPENING_MS = STAGE_MS.filmOpening;

/** Silêncio de assimilação após o filme terminar (ms). */
export const FILM_ASSIMILATION_MS = STAGE_MS.filmAssimilation;

export const FILM_DEFAULT_SRC = "/film/aliviar.mp4";

export const FILM_POSTER_SRC = "/film/poster.svg";

export function resolveFilmSrc(envSrc?: string): string {
  const trimmed = envSrc?.trim();
  return trimmed || FILM_DEFAULT_SRC;
}
