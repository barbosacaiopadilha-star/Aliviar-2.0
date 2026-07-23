import { STAGE_MS } from "./stage-tokens";

export { FILM_CONSOLIDATION_LINE } from "./continuation-model";

/**
 * Vídeo institucional provisório aprovado (Aliviar 1.0).
 * Substituir o arquivo em `public/film/aliviar.mp4` quando o filme F02 estiver pronto.
 * O conteúdo do vídeo não é alterado pela experiência — apenas integrado.
 */
export const FILM_PROVISIONAL_ASSET = "aliviar-1.0";

/**
 * Bloqueador conhecido: o arquivo `public/film/aliviar.mp4` não está versionado.
 * Copiar o vídeo institucional Aliviar 1.0 para esse caminho ou definir
 * `NEXT_PUBLIC_ALIVIAR_FILM_SRC` com a URL oficial antes do deploy.
 */
export const FILM_ASSET_BLOCKER =
  "public/film/aliviar.mp4 ausente — usar asset Aliviar 1.0 ou NEXT_PUBLIC_ALIVIAR_FILM_SRC";

/** Pausa editorial no poster quando o filme não está disponível (ms). */
export const FILM_FALLBACK_POSTER_MS = 2400;

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
