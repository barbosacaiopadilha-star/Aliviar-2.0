import { describe, expect, it } from "vitest";

import { FILM_CONSOLIDATION_LINE } from "./continuation-model";
import {
  FILM_ASSIMILATION_MS,
  FILM_OPENING_MS,
  resolveFilmSrc,
} from "./film-model";
import { THRESHOLD_FORBIDDEN_WORDS } from "./threshold-model";

describe("film-model", () => {
  it("resolve a fonte do filme com fallback canônico", () => {
    expect(resolveFilmSrc(undefined)).toBe("/film/aliviar.mp4");
    expect(resolveFilmSrc("  ")).toBe("/film/aliviar.mp4");
    expect(resolveFilmSrc("https://example.com/filme.mp4")).toBe(
      "https://example.com/filme.mp4",
    );
  });

  it("reserva tempo de abertura e assimilação", () => {
    expect(FILM_OPENING_MS).toBeGreaterThanOrEqual(1500);
    expect(FILM_ASSIMILATION_MS).toBeGreaterThanOrEqual(4000);
  });

  it("consolida sem pedir ação nem repetir marketing", () => {
    const text = FILM_CONSOLIDATION_LINE.toLowerCase();
    expect(text).not.toContain("clique");
    expect(text).not.toContain("comece");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("play");

    for (const word of THRESHOLD_FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
  });
});
