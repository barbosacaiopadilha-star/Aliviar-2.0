import { describe, expect, it } from "vitest";

import { THRESHOLD_PRESENCE_TIMING } from "./threshold-presence";
import { THRESHOLD_GESTURE_HINT, THRESHOLD_GESTURE_READY_MS } from "./threshold-gesture";
import { STAGE_MS } from "./stage-tokens";

describe("threshold-gesture", () => {
  it("libera o gesto após a primeira frase, sem espera excessiva", () => {
    const lineSettlesAt = STAGE_MS.lineDelay + STAGE_MS.lineIn;

    expect(THRESHOLD_GESTURE_READY_MS).toBeGreaterThanOrEqual(lineSettlesAt);
    expect(THRESHOLD_GESTURE_READY_MS).toBeLessThanOrEqual(7000);
    expect(THRESHOLD_GESTURE_READY_MS).toBeLessThan(THRESHOLD_PRESENCE_TIMING.presenceBeginMs);
  });

  it("expõe hint editorial mínimo", () => {
    expect(THRESHOLD_GESTURE_HINT).toBe("Toque a luz.");
  });
});
