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
    expect(labels).not.toContain("Painel Concierge");
    expect(labels).not.toContain("Observabilidade ACE");
  });

  it("não oferece destino que não existe", () => {
    // Este teste exigia "Observabilidade da plataforma" no menu. O destino
    // dela, `/admin/ace`, responde 404: era o painel de um motor que não
    // executa mais, e o item 1.7 (DP-2) removeu o link da tela de caso sem
    // remover o do menu. O item saiu; a garantia que fica é a inversa — nenhum
    // caminho do menu pode apontar para fora das rotas que existem.
    const hrefs = getNavGroups("administrador", "/admin").flatMap((group) =>
      group.items.map((item) => item.href),
    );

    expect(hrefs).not.toContain("/admin/ace");
    for (const href of hrefs) {
      expect(
        href.startsWith("/admin") ||
          href.startsWith("/coa") ||
          href === "/atendimento" ||
          href === "/acompanhamento",
      ).toBe(true);
    }
  });

  it("os três níveis apontam para onde o trabalho acontece — não para vitrines", () => {
    // /coa/atendimento e /coa/concierge saíram (auditoria operacional de
    // 21/08, F-3): eram dashboards sobre os mesmos dados das jornadas, e o
    // próprio hub COA já dizia que tinham deixado de ser porta de entrada.
    // O menu leva às jornadas.
    const coa = getNavGroups("administrador", "/admin").find(
      (group) => group.label === "Centro de Operações",
    );

    expect(coa?.items.map((item) => item.href)).toEqual([
      "/coa",
      "/atendimento",
      "/coa/curadoria",
      "/acompanhamento",
    ]);
  });
});
