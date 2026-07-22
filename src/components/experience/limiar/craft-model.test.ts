import { describe, expect, it } from "vitest";

import { buildCraftLines } from "./craft-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";
import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";

describe("craft-model", () => {
  it("revela o ofício após a continuação, com ritmo espaçado", () => {
    const lines = buildCraftLines();
    expect(lines).toHaveLength(2);
    expect(lines[0].delayMs).toBeGreaterThan(
      STAGE_MS.continuationLine3Delay + STAGE_MS.consolidationIn,
    );
    expect(lines[0].delayMs).toBe(LANDING_SECTION_MS.craft);
    expect(lines[1].delayMs - lines[0].delayMs).toBe(STAGE_MS.sectionLineGap);
  });

  it("responde o que muda na vida — sem vender curadoria ou empresa", () => {
    const text = buildCraftLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("sozinho");
    expect(text).not.toContain("clareza");
    expect(text).not.toContain("ganha");
    expect(text).not.toContain("curadoria");
    expect(text).not.toContain("empresa");
    expect(text).not.toContain("benefício");
    expect(text).not.toContain("plataforma");
    expect(text).not.toContain("comece");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("rigor");

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("nomeia o ofício — estudar, comparar, permanecer", () => {
    const text = buildCraftLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("estuda");
    expect(text).toContain("compara");
    expect(text).toContain("permanece");
  });
});
