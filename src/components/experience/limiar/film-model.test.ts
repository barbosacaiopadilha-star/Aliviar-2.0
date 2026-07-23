import { describe, expect, it } from "vitest";

import { FILM_CONSOLIDATION_LINE } from "./continuation-model";
import {
  FILM_ASSIMILATION_MS,
  FILM_ASSET_BLOCKER,
  FILM_FALLBACK_POSTER_MS,
  FILM_OPENING_MS,
  FILM_POSTER_SRC,
  FILM_PROVISIONAL_ASSET,
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
    expect(FILM_POSTER_SRC).toBe("/film/poster.svg");
    expect(FILM_PROVISIONAL_ASSET).toBe("aliviar-1.0");
  });

  it("reserva tempo de abertura, assimilação e fallback editorial", () => {
    expect(FILM_OPENING_MS).toBeGreaterThanOrEqual(1500);
    expect(FILM_ASSIMILATION_MS).toBeGreaterThanOrEqual(4000);
    expect(FILM_FALLBACK_POSTER_MS).toBeGreaterThan(0);
    expect(FILM_ASSET_BLOCKER).toContain("aliviar.mp4");
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
