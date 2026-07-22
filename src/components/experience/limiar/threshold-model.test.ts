import { describe, expect, it } from "vitest";

import {
  THRESHOLD_FIRST_LINE,
  THRESHOLD_FORBIDDEN_WORDS,
} from "./threshold-model";

describe("threshold-model", () => {
  it("define uma única saudação mínima no limiar", () => {
    expect(THRESHOLD_FIRST_LINE.trim()).toBe("Olá,");
    expect(THRESHOLD_FIRST_LINE.split(/[.!?]/).filter(Boolean)).toHaveLength(1);
  });

  it("não usa linguagem de marketing ou sistema", () => {
    const text = THRESHOLD_FIRST_LINE.toLowerCase();

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("acolhe sem pedir ação", () => {
    const text = THRESHOLD_FIRST_LINE.toLowerCase();
    expect(text).not.toContain("clique");
    expect(text).not.toContain("comece");
    expect(text).not.toContain("cadastr");
  });
});
