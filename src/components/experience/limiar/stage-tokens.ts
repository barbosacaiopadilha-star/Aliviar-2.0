/**
 * Palco — tokens oficiais de produção do limiar.
 * Fonte única para CSS (via custom properties), JS e PRODUCTION_NOTES.md.
 */

/** Curva editorial padrão do palco. */
export const STAGE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Tempos oficiais (ms). */
export const STAGE_MS = {
  arrival: 2800,
  lampDelay: 1900,
  lampIn: 2200,
  lineDelay: 4900,
  lineIn: 1350,
  presenceBegin: 7200,
  presenceLeakIn: 3800,
  presenceFloorDelay: 7800,
  presenceFloorIn: 4500,
  gestureReady: 11000,
  filmOpening: 1800,
  filmAssimilation: 4800,
  consolidationDelay: 600,
  consolidationIn: 1400,
} as const;

/** Durações de fade para CSS (ms). */
export const STAGE_DURATION_MS = {
  arrival: STAGE_MS.arrival,
  reveal: STAGE_MS.lineIn,
  cross: STAGE_MS.filmOpening,
  release: 2200,
  breathe: 8000,
} as const;

/** Opacidades oficiais. */
export const STAGE_OPACITY = {
  atmosphereFilm: 0.28,
  roomGlowMin: 0.24,
  roomGlowMax: 0.3,
  lampMin: 0.7,
  lampMax: 0.92,
  presenceLeak: 0.18,
  presenceFloor: 0.12,
} as const;

/** Deslocamento vertical na revelação de voz (rem). */
export const STAGE_SHIFT_REVEAL_REM = 0.2;
