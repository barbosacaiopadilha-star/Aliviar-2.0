import { describe, expect, it } from "vitest";

import { adminPatientProfileSchema, createPatientAccountSchema } from "@/modules/profiles/patient-account-schema";

describe("createPatientAccountSchema", () => {
  it("aceita e-mail e nome válidos", () => {
    const result = createPatientAccountSchema.safeParse({
      email: "paciente@example.com",
      displayName: "Maria Souza",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = createPatientAccountSchema.safeParse({
      email: "não-é-um-email",
      displayName: "Maria Souza",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const result = createPatientAccountSchema.safeParse({
      email: "paciente@example.com",
      displayName: "",
    });
    expect(result.success).toBe(false);
  });

  it("nunca aceita um campo de senha (a senha é sempre gerada pelo sistema)", () => {
    const parsed = createPatientAccountSchema.parse({
      email: "paciente@example.com",
      displayName: "Maria Souza",
    });
    expect(parsed).not.toHaveProperty("password");
  });
});

describe("adminPatientProfileSchema", () => {
  it("aceita campos opcionais vazios", () => {
    const result = adminPatientProfileSchema.safeParse({ phone: "", city: "", state: "" });
    expect(result.success).toBe(true);
  });

  it("normaliza o estado para maiúsculo", () => {
    const result = adminPatientProfileSchema.safeParse({ phone: "", city: "", state: "rj" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("RJ");
    }
  });

  it("nunca aceita preferências de comunicação (permanecem exclusivas do paciente)", () => {
    const parsed = adminPatientProfileSchema.parse({ phone: "", city: "", state: "" });
    expect(parsed).not.toHaveProperty("preferredChannel");
    expect(parsed).not.toHaveProperty("acceptsReminders");
  });
});
