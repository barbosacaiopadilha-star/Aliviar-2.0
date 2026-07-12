import { describe, expect, it } from "vitest";

import {
  requestPasswordResetSchema,
  signInSchema,
  updatePasswordSchema,
} from "@/modules/auth/schema";

describe("signInSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const result = signInSchema.safeParse({ email: "não-é-email", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha curta", () => {
    const result = signInSchema.safeParse({ email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("aceita e-mail válido", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejeita e-mail vazio", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("aceita senha com 8+ caracteres", () => {
    expect(updatePasswordSchema.safeParse({ password: "12345678" }).success).toBe(true);
  });

  it("rejeita senha curta", () => {
    expect(updatePasswordSchema.safeParse({ password: "123" }).success).toBe(false);
  });
});
