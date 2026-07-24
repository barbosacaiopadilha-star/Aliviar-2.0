import { describe, expect, it } from "vitest";

import { classifySourceLevel, enrichEvidence, isHighTrustLevel } from "../source-levels";

describe("source-levels", () => {
  it("classifica CRM como nível 1", () => {
    expect(classifySourceLevel("CRM-ES 12.345", "Registro profissional")).toBe(1);
  });

  it("classifica RQE como nível 1", () => {
    expect(classifySourceLevel("RQE 8.443", "Registro de qualificação de especialista")).toBe(1);
  });

  it("classifica TEOT como nível 3", () => {
    expect(classifySourceLevel("TEOT 18.141", "Título de especialista")).toBe(3);
  });

  it("classifica instituição como nível 2", () => {
    expect(classifySourceLevel("Hospital Meridional", "Instituição")).toBe(2);
  });

  it("classifica diretório como nível 6", () => {
    expect(classifySourceLevel("Doctoralia", "Diretório")).toBe(6);
  });

  it("enriquece evidência com nível e campos suportados", () => {
    const evidence = enrichEvidence({
      id: "1",
      name: "CRM-ES 11.596",
      type: "Registro profissional",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    });

    expect(evidence.level).toBe(1);
    expect(evidence.supportsFields).toContain("crm");
    expect(isHighTrustLevel(evidence.level)).toBe(true);
  });
});
