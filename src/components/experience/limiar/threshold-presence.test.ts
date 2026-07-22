import { describe, expect, it } from "vitest";

import {
  THRESHOLD_PRESENCE_FORBIDDEN_PHRASES,
  THRESHOLD_PRESENCE_TIMING,
  THRESHOLD_PRESENCE_VISIBLE_COPY,
} from "./threshold-presence";
import { THRESHOLD_FIRST_LINE } from "./threshold-model";

describe("threshold-presence", () => {
  it("não expõe texto visível na fase de presença", () => {
    expect(THRESHOLD_PRESENCE_VISIBLE_COPY).toHaveLength(0);
  });

  it("inicia a presença somente depois da primeira frase", () => {
    const lineSettlesAt =
      THRESHOLD_PRESENCE_TIMING.lineRevealMs + THRESHOLD_PRESENCE_TIMING.lineDurationMs;

    expect(THRESHOLD_PRESENCE_TIMING.presenceBeginMs).toBeGreaterThan(lineSettlesAt);
  });

  it("não declara presença com palavras", () => {
    const copy = [THRESHOLD_FIRST_LINE, ...THRESHOLD_PRESENCE_VISIBLE_COPY]
      .join(" ")
      .toLowerCase();

    for (const phrase of THRESHOLD_PRESENCE_FORBIDDEN_PHRASES) {
      expect(copy).not.toContain(phrase);
    }
  });
});
