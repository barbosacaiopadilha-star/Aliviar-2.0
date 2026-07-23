import { describe, expect, it } from "vitest";

import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";

describe("stage-tokens", () => {
  it("mantém a ordem emocional do palco", () => {
    expect(STAGE_MS.lampDelay).toBeLessThan(STAGE_MS.lineDelay);
    expect(STAGE_MS.lineDelay + STAGE_MS.lineIn).toBeLessThan(STAGE_MS.presenceBegin);
    expect(STAGE_MS.lineDelay + STAGE_MS.lineIn).toBeLessThanOrEqual(STAGE_MS.gestureReady);
    expect(STAGE_MS.filmOpening).toBeGreaterThanOrEqual(1500);
    expect(STAGE_MS.filmAssimilation).toBeGreaterThanOrEqual(4000);
  });

  it("usa tempos de abertura e assimilação alinhados ao filme", () => {
    expect(STAGE_MS.filmOpening).toBe(1800);
    expect(STAGE_MS.filmAssimilation).toBe(4800);
  });

  it("espaça a continuação após a consolidação", () => {
    expect(STAGE_MS.continuationLine2Delay).toBeGreaterThan(
      STAGE_MS.consolidationDelay + STAGE_MS.consolidationIn,
    );
    expect(STAGE_MS.continuationLine3Delay).toBeGreaterThan(
      STAGE_MS.continuationLine2Delay + STAGE_MS.consolidationIn,
    );
  });

  it("reserva respiro entre blocos da landing", () => {
    expect(LANDING_SECTION_MS.craft).toBeGreaterThan(STAGE_MS.continuationLine3Delay);
    expect(LANDING_SECTION_MS.path).toBeGreaterThan(LANDING_SECTION_MS.craft);
  });
});
