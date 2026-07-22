/**
 * Fase de presença — após a luz e a primeira frase.
 * Presença transmitida só por ambiente; nenhum texto visível.
 */
export const THRESHOLD_PRESENCE_VISIBLE_COPY: readonly string[] = [];

/** Frases proibidas na fase de presença — presença não se declara. */
export const THRESHOLD_PRESENCE_FORBIDDEN_PHRASES = [
  "estamos aqui",
  "estamos acordados",
  "alguém está",
  "há alguém",
  "estamos esperando",
  "aguarde",
] as const;

/** Ritmo da fase de presença (ms) — alinhado às animações CSS. */
export const THRESHOLD_PRESENCE_TIMING = {
  lineRevealMs: 4900,
  lineDurationMs: 1350,
  presenceBeginMs: 7200,
} as const;
