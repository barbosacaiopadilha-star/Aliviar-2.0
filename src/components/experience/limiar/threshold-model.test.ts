import { describe, expect, it } from "vitest";

import {
  THRESHOLD_FIRST_LINE,
  THRESHOLD_FORBIDDEN_WORDS,
  THRESHOLD_LINE_ALTERNATIVES,
} from "./threshold-model";

describe("threshold-model", () => {
  it("define uma única frase de acolhimento no limiar", () => {
    expect(THRESHOLD_FIRST_LINE.trim()).toBe("A luz ficou acesa.");
    expect(THRESHOLD_FIRST_LINE.split(/[.!?]/).filter(Boolean)).toHaveLength(1);
  });

  it("documenta dezenas de alternativas antes da escolha", () => {
    expect(THRESHOLD_LINE_ALTERNATIVES.length).toBeGreaterThanOrEqual(30);
  });

  it("não usa linguagem de marketing ou sistema", () => {
    const text = THRESHOLD_FIRST_LINE.toLowerCase();

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });

  it("acolhe sem pedir ação nem explicar o serviço", () => {
    const text = THRESHOLD_FIRST_LINE.toLowerCase();
    expect(text).not.toContain("clique");
    expect(text).not.toContain("comece");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("curadoria");
    expect(text).not.toContain("vídeo");
    expect(text).not.toContain("aliviar");
  });
});
