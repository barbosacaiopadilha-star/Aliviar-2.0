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
});
