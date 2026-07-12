import { describe, expect, it } from "vitest";

import { getRoleHome } from "@/modules/auth/role-home";

describe("getRoleHome", () => {
  it("resolve a home de cada papel conhecido", () => {
    expect(getRoleHome(["administrador"])).toBe("/admin");
    expect(getRoleHome(["profissional"])).toBe("/profissional");
    expect(getRoleHome(["paciente"])).toBe("/paciente");
  });

  it("usa o fallback quando não há papel conhecido", () => {
    expect(getRoleHome([])).toBe("/");
    expect(getRoleHome(["papel-desconhecido"])).toBe("/");
    expect(getRoleHome([], "/outro")).toBe("/outro");
  });

  it("usa o primeiro papel conhecido quando há mais de um", () => {
    expect(getRoleHome(["papel-desconhecido", "paciente"])).toBe("/paciente");
  });
});
