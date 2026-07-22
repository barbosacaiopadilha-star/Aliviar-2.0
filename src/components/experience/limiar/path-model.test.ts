import { describe, expect, it } from "vitest";

import { buildPathLines } from "./path-model";
import { LANDING_SECTION_MS, STAGE_MS } from "./stage-tokens";
import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";

describe("path-model", () => {
  it("revela o caminho após o ofício, com ritmo espaçado", () => {
    const lines = buildPathLines();
    expect(lines).toHaveLength(3);
    expect(lines[0].delayMs).toBe(LANDING_SECTION_MS.path);
    expect(lines[1].delayMs - lines[0].delayMs).toBe(STAGE_MS.sectionLineGap);
  });

  it("transmite caminho — não processo, timeline ou etapas visuais", () => {
    const text = buildPathLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("caminho");
    expect(text).toContain("conversa");
    expect(text).not.toMatch(/\b1\b|\b2\b|\b3\b/);
    expect(text).not.toContain("etapa");
    expect(text).not.toContain("timeline");
    expect(text).not.toContain("fluxo");
    expect(text).not.toContain("card");
    expect(text).not.toContain("curadoria");

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("evita linguagem de jornada comercial", () => {
    const text = buildPathLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).not.toContain("jornada");
    expect(text).not.toContain("onboarding");
    expect(text).not.toContain("funil");
  });
});
