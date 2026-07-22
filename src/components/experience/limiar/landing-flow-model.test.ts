import { describe, expect, it } from "vitest";

import {
  buildLandingFlowLines,
  isLandingFlowRhythmValid,
  landingFlowMinGapMs,
} from "./landing-flow-model";
import { LANDING_INVITE_GESTURE } from "./invite-model";
import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";

describe("landing-flow-model", () => {
  it("compõe a landing na ordem emocional canônica", () => {
    const lines = buildLandingFlowLines();
    expect(lines).toHaveLength(10);
    expect(lines[0].text).toBe("Isso fica com você.");
    expect(lines[lines.length - 1].text).toBe("Pode fechar esta página. A luz fica acesa.");
  });

  it("mantém ritmo crescente em toda a sequência", () => {
    const lines = buildLandingFlowLines();
    expect(isLandingFlowRhythmValid(lines)).toBe(true);
    expect(landingFlowMinGapMs()).toBeGreaterThanOrEqual(1000);
  });

  it("preserva landing sem marketing, software ou captura", () => {
    const text = buildLandingFlowLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    const inviteCount = (text.match(/podemos conversar/g) ?? []).length;
    expect(inviteCount).toBe(1);
    expect(text).toContain(LANDING_INVITE_GESTURE.toLowerCase());

    expect(text).not.toContain("benefício");
    expect(text).not.toContain("plataforma");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("clique");
    expect(text).not.toContain("curadoria");
    expect(text).not.toContain("faq");
    expect(text).not.toContain("card");
    expect(text).not.toContain("grid");
    expect(text).not.toContain("clareza");
    expect(text).not.toContain("roteiro");
    expect(text).not.toContain("rigor");

    const escutaCount = (text.match(/escuta/g) ?? []).length;
    expect(escutaCount).toBeLessThanOrEqual(1);

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });
});
