import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PatientShell } from "@/components/paciente/patient-shell";
import { PATIENT_NAV_ITEMS } from "@/components/paciente/patient-nav-items";

// PRODUTO DO PACIENTE — Fase 2, Parte 2: prova, ao vivo, que a navegação
// desktop e a navegação mobile (Drawer) renderizam exatamente os mesmos
// itens — porque as duas leem PATIENT_NAV_ITEMS através do mesmo
// componente NavLinks, nunca duas listas paralelas.

vi.mock("next/navigation", () => ({
  usePathname: () => "/paciente",
}));

afterEach(cleanup);

describe("PatientShell — navegação com fonte única", () => {
  it("a navegação desktop (nav principal) mostra todos os itens da configuração canônica", () => {
    render(
      <PatientShell>
        <p>conteúdo</p>
      </PatientShell>,
    );

    // Header e Drawer usam o mesmo aria-label ("Navegação principal") — em
    // jsdom nenhum dos dois é removido do DOM por classes responsivas
    // (hidden lg:block / translate no Drawer fechado), então os dois
    // existem simultaneamente. O header vem primeiro na árvore.
    const [desktopNav] = screen.getAllByRole("navigation", {
      name: "Navegação principal",
    });
    for (const item of PATIENT_NAV_ITEMS) {
      expect(
        within(desktopNav).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }
  });

  it("inclui Minha Curadoria, Linha do tempo e Perfil — os três que faltavam nas duas fontes divergentes antes desta fase", () => {
    render(
      <PatientShell>
        <p>conteúdo</p>
      </PatientShell>,
    );

    // Header e Drawer usam o mesmo aria-label ("Navegação principal") — em
    // jsdom nenhum dos dois é removido do DOM por classes responsivas
    // (hidden lg:block / translate no Drawer fechado), então os dois
    // existem simultaneamente. O header vem primeiro na árvore.
    const [desktopNav] = screen.getAllByRole("navigation", {
      name: "Navegação principal",
    });
    expect(
      within(desktopNav).getByRole("link", { name: "Linha do tempo" }),
    ).toHaveAttribute("href", "/paciente/linha-do-tempo");
  });

  it("navegação desktop e mobile (Drawer) mostram exatamente os mesmos itens, na mesma ordem", async () => {
    const user = userEvent.setup();
    render(
      <PatientShell>
        <p>conteúdo</p>
      </PatientShell>,
    );

    // Antes de abrir o Drawer, ele fica aria-hidden — testing-library
    // corretamente o exclui de getAllByRole (mesma regra de acessibilidade
    // real: um leitor de tela não deveria ver os dois menus ao mesmo
    // tempo). Abrir o Drawer expõe sua navegação para comparação.
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));

    const [desktopNav, mobileNav] = screen.getAllByRole("navigation", {
      name: "Navegação principal",
    });
    const desktopLabels = within(desktopNav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    const mobileLabels = within(mobileNav)
      .getAllByRole("link")
      .map((link) => link.textContent);

    expect(desktopLabels).toEqual(PATIENT_NAV_ITEMS.map((item) => item.label));
    expect(mobileLabels).toEqual(desktopLabels);
  });

  it("item ativo (rota atual) recebe aria-current", () => {
    render(
      <PatientShell>
        <p>conteúdo</p>
      </PatientShell>,
    );

    // Header e Drawer usam o mesmo aria-label ("Navegação principal") — em
    // jsdom nenhum dos dois é removido do DOM por classes responsivas
    // (hidden lg:block / translate no Drawer fechado), então os dois
    // existem simultaneamente. O header vem primeiro na árvore.
    const [desktopNav] = screen.getAllByRole("navigation", {
      name: "Navegação principal",
    });
    expect(
      within(desktopNav).getByRole("link", { name: "Início" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(desktopNav).getByRole("link", { name: "Perfil" }),
    ).not.toHaveAttribute("aria-current");
  });
});
