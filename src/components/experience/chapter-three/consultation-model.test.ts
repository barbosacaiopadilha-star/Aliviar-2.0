import { describe, expect, it } from "vitest";

import {
  buildConfirmIntroLines,
  buildPreparationLines,
  buildSynthesisLines,
  buildWelcomeLines,
  JOURNEY_MANAGER,
} from "./consultation-model";

describe("consultation-model", () => {
  it("apresenta a profissional e o propósito do encontro", () => {
    const welcome = buildWelcomeLines();
    expect(welcome.some((line) => line.includes("Dra. Marina"))).toBe(true);
    expect(welcome.some((line) => line.includes("consulta inicial"))).toBe(true);
  });

  it("deixa claro que não é questionário nem triagem", () => {
    const prep = buildPreparationLines();
    expect(prep.some((line) => line.includes("questionário"))).toBe(true);
    expect(prep.some((line) => line.includes("escuta"))).toBe(true);
  });

  it("introduz o gestor da jornada pelo nome", () => {
    const synthesis = buildSynthesisLines();
    expect(synthesis.some((line) => line.includes(JOURNEY_MANAGER))).toBe(true);
  });

  it("pede confirmação sem pressão", () => {
    const confirm = buildConfirmIntroLines();
    expect(confirm.some((line) => line.includes("Sem pressa"))).toBe(true);
  });
});
