import { describe, expect, it } from "vitest";

import { THRESHOLD_PRESENCE_TIMING } from "./threshold-presence";
import { THRESHOLD_GESTURE_READY_MS } from "./threshold-gesture";

describe("threshold-gesture", () => {
  it("libera o gesto somente depois da fase de presença", () => {
    const presenceSettlesAt =
      THRESHOLD_PRESENCE_TIMING.presenceBeginMs +
      THRESHOLD_PRESENCE_TIMING.lineDurationMs;

    expect(THRESHOLD_GESTURE_READY_MS).toBeGreaterThan(presenceSettlesAt);
  });
});
