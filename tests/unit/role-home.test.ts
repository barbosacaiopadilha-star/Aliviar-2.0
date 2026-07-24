import { describe, expect, it } from "vitest";

import { getAuthenticatedPortalCta, getRoleHome } from "@/modules/auth/role-home";

describe("getAuthenticatedPortalCta", () => {
  it("prioriza o portal do paciente", () => {
    expect(getAuthenticatedPortalCta(["paciente", "administrador"])).toEqual({
      label: "Minha Jornada",
      href: "/paciente",
    });
  });

  it("aponta curador para o COA Curadoria", () => {
    expect(getAuthenticatedPortalCta(["curador_medico"])).toEqual({
      label: "Curadoria",
      href: "/coa/curadoria",
    });
  });

  it("aponta administrador para o Centro de Operações", () => {
    expect(getAuthenticatedPortalCta(["administrador"])).toEqual({
      label: "Centro de Operações",
      href: "/coa",
    });
  });

  it("retorna null sem papéis reconhecidos", () => {
    expect(getAuthenticatedPortalCta([])).toBeNull();
  });
});

describe("getRoleHome", () => {
  it("mantém o mapa de destino por papel", () => {
    expect(getRoleHome(["curador_medico"])).toBe("/coa/curadoria");
    expect(getRoleHome(["paciente"])).toBe("/paciente");
    expect(getRoleHome(["concierge"])).toBe("/coa/atendimento");
  });
});
