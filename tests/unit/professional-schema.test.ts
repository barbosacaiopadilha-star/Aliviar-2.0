import { describe, expect, it } from "vitest";

import { professionalProfileSchema } from "@/modules/profiles/professional-schema";

function buildValidInput() {
  return {
    displayName: "Dra. Ana Souza",
    professionalIdentifier: "CRP-12345",
    crm: "",
    crmUf: "",
    professionalSummary: "Psicóloga com experiência em ansiedade.",
    institutionName: "",
  };
}

describe("professionalProfileSchema", () => {
  it("aceita uma entrada válida (CRM/instituição opcionais ausentes)", () => {
    const result = professionalProfileSchema.safeParse(buildValidInput());
    expect(result.success).toBe(true);
  });

  it("aceita CRM e UF quando informados", () => {
    const result = professionalProfileSchema.safeParse({
      ...buildValidInput(),
      crm: "123456",
      crmUf: "sp",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crmUf).toBe("SP");
    }
  });

  it("rejeita nome de exibição vazio", () => {
    const result = professionalProfileSchema.safeParse({ ...buildValidInput(), displayName: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita identificação profissional vazia", () => {
    const result = professionalProfileSchema.safeParse({
      ...buildValidInput(),
      professionalIdentifier: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita UF do CRM fora do formato de 2 letras", () => {
    const result = professionalProfileSchema.safeParse({
      ...buildValidInput(),
      crm: "123",
      crmUf: "São Paulo",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita resumo profissional além do tamanho máximo", () => {
    const result = professionalProfileSchema.safeParse({
      ...buildValidInput(),
      professionalSummary: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("nunca aceita campos de busca/ACE/agenda/preço (fora de escopo desta sprint)", () => {
    const parsed = professionalProfileSchema.parse(buildValidInput());
    expect(parsed).not.toHaveProperty("competencyAreas");
    expect(parsed).not.toHaveProperty("price");
    expect(parsed).not.toHaveProperty("schedule");
  });
});
