import { describe, expect, it } from "vitest";

import { getNavGroups } from "@/components/shell/nav-items";

describe("navegação administrativa do Centro de Operações", () => {
  it("expõe o COA como operação vigente e não reintroduz rótulos legados", () => {
    const groups = getNavGroups("administrador", "/admin");
    const labels = groups.flatMap((group) => [
      group.label,
      ...group.items.map((item) => item.label),
    ]);

    expect(labels).toContain("Centro de Operações");
    expect(labels).toContain("Visão operacional");
    expect(labels).toContain("Curadoria");
    expect(labels).toContain("Observabilidade da plataforma");
    expect(labels).not.toContain("Painel Concierge");
    expect(labels).not.toContain("Observabilidade ACE");
  });

  it("mantém os três níveis operacionais acessíveis ao administrador", () => {
    const coa = getNavGroups("administrador", "/admin").find(
      (group) => group.label === "Centro de Operações",
    );

    expect(coa?.items.map((item) => item.href)).toEqual([
      "/coa",
      "/coa/atendimento",
      "/coa/curadoria",
      "/coa/concierge",
    ]);
  });
});
