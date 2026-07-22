import { describe, expect, it } from "vitest";

import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";
import { buildFilmContinuationLines } from "./continuation-model";
import { STAGE_MS } from "./stage-tokens";

describe("continuation-model", () => {
  it("revela poucas linhas em ritmo espaçado", () => {
    const lines = buildFilmContinuationLines();
    expect(lines).toHaveLength(3);
    expect(lines[1].delayMs).toBeGreaterThan(
      lines[0].delayMs + STAGE_MS.consolidationIn,
    );
    expect(lines[2].delayMs).toBeGreaterThan(
      lines[1].delayMs + STAGE_MS.consolidationIn,
    );
  });

  it("nomeia quem são — sem explicar serviço ou pedir ação", () => {
    const text = buildFilmContinuationLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("pessoas");
    expect(text).not.toContain("curadoria");
    expect(text).not.toContain("jornada");
    expect(text).not.toContain("clique");
    expect(text).not.toContain("comece");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("benefício");
    expect(text).not.toContain("faq");

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("começa pela consolidação do que ficou", () => {
    const lines = buildFilmContinuationLines();
    expect(lines[0].text).toBe("Isso fica com você.");
  });
});
