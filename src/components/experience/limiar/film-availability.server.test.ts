import { describe, expect, it } from "vitest";

import { isFilmAssetDeployed } from "./film-availability.server";
import { FILM_DEFAULT_SRC } from "./film-model";

describe("film-availability.server", () => {
  it("detecta ausência do asset local padrão", () => {
    expect(isFilmAssetDeployed(FILM_DEFAULT_SRC)).toBe(false);
  });

  it("considera URLs remotas disponíveis para validação em runtime", () => {
    expect(isFilmAssetDeployed("https://cdn.example.com/aliviar.mp4")).toBe(true);
  });

  it("detecta poster local existente", () => {
    expect(isFilmAssetDeployed("/film/poster.svg")).toBe(true);
  });
});
