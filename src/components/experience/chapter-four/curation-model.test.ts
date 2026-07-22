import { describe, expect, it } from "vitest";

import { buildCurationPresenceLines, CURATION_HOST } from "./curation-model";

describe("curation-model", () => {
  it("apresenta o gestor e o início da curadoria", () => {
    const lines = buildCurationPresenceLines();
    expect(lines.some((line) => line.text.includes(CURATION_HOST))).toBe(true);
    expect(lines.some((line) => line.text.includes("curadoria começou"))).toBe(true);
  });

  it("deixa claro que o paciente não precisa agir agora", () => {
    const lines = buildCurationPresenceLines();
    expect(lines.some((line) => line.text.includes("não precisa fazer nada"))).toBe(true);
  });

  it("define o próximo passo como responsabilidade da Aliviar", () => {
    const lines = buildCurationPresenceLines();
    expect(lines.some((line) => line.text.includes("próximo passo agora é nosso"))).toBe(true);
  });

  it("não usa linguagem de espera ou status", () => {
    const text = buildCurationPresenceLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();
    expect(text).not.toContain("aguarde");
    expect(text).not.toContain("status");
    expect(text).not.toContain("%");
  });
});
