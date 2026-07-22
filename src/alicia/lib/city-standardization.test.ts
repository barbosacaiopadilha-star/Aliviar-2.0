import { describe, expect, it } from "vitest";

import { canonicalizeCityName } from "./city-standardization";

describe("city standardization", () => {
  it("canonicalizes common aliases", () => {
    expect(canonicalizeCityName("Cariacica")).toBe("Cariácica");
    expect(canonicalizeCityName("vitoria")).toBe("Vitória");
    expect(canonicalizeCityName("Sao Mateus")).toBe("São Mateus");
  });

  it("preserves unknown cities", () => {
    expect(canonicalizeCityName("Cidade Exemplo")).toBe("Cidade Exemplo");
  });
});
