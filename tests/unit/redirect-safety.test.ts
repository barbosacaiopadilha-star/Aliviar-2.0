import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/modules/auth/redirect-safety";

describe("getSafeRedirectPath", () => {
  it("aceita caminho relativo simples", () => {
    expect(getSafeRedirectPath("/painel")).toBe("/painel");
  });

  it("usa / como padrão quando ausente", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath(undefined)).toBe("/");
    expect(getSafeRedirectPath("")).toBe("/");
  });

  it("rejeita URL absoluta (open redirect)", () => {
    expect(getSafeRedirectPath("https://evil.com")).toBe("/");
    expect(getSafeRedirectPath("http://evil.com/path")).toBe("/");
  });

  it("rejeita protocol-relative (open redirect)", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/");
  });

  it("rejeita variante com barra invertida", () => {
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/");
  });

  it("rejeita caminho que não começa com /", () => {
    expect(getSafeRedirectPath("evil.com")).toBe("/");
  });

  it("usa o fallback customizado quando ausente ou inseguro", () => {
    expect(getSafeRedirectPath(null, "/admin")).toBe("/admin");
    expect(getSafeRedirectPath("//evil.com", "/admin")).toBe("/admin");
    expect(getSafeRedirectPath("https://evil.com", "/paciente")).toBe("/paciente");
  });

  it("prioriza o caminho seguro sobre o fallback quando ambos existem", () => {
    expect(getSafeRedirectPath("/area-restrita", "/admin")).toBe("/area-restrita");
  });
});
