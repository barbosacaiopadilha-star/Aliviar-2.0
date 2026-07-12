import { describe, expect, it } from "vitest";

import { patientProfileSchema } from "@/modules/profiles/patient-schema";

function buildValidInput() {
  return {
    phone: "+55 11 91234-5678",
    city: "São Paulo",
    state: "sp",
    preferredChannel: "email",
    acceptsReminders: true,
  };
}

describe("patientProfileSchema", () => {
  it("aceita uma entrada válida", () => {
    const result = patientProfileSchema.safeParse(buildValidInput());
    expect(result.success).toBe(true);
  });

  it("normaliza o estado para maiúsculo", () => {
    const result = patientProfileSchema.safeParse(buildValidInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("SP");
    }
  });

  it("trata campos opcionais vazios (string vazia) como ausentes", () => {
    const result = patientProfileSchema.safeParse({
      ...buildValidInput(),
      phone: "",
      city: "",
      state: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.city).toBeUndefined();
      expect(result.data.state).toBeUndefined();
    }
  });

  it("rejeita telefone com formato inválido", () => {
    const result = patientProfileSchema.safeParse({ ...buildValidInput(), phone: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejeita estado que não seja uma sigla de 2 letras", () => {
    const result = patientProfileSchema.safeParse({ ...buildValidInput(), state: "São Paulo" });
    expect(result.success).toBe(false);
  });

  it("rejeita canal de comunicação fora do conjunto fechado", () => {
    const result = patientProfileSchema.safeParse({ ...buildValidInput(), preferredChannel: "carta" });
    expect(result.success).toBe(false);
  });

  it("exige acceptsReminders como boolean explícito", () => {
    const result = patientProfileSchema.safeParse({ ...buildValidInput(), acceptsReminders: "sim" });
    expect(result.success).toBe(false);
  });

  it("nunca aceita campo de dado clínico (não faz parte do schema)", () => {
    const parsed = patientProfileSchema.parse(buildValidInput());
    expect(parsed).not.toHaveProperty("diagnosis");
    expect(parsed).not.toHaveProperty("historia");
  });
});
