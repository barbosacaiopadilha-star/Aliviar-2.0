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

  it("três itens, um por ato — o menu enxuto de 23/08", () => {
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
    // A asserção ancora no DESTINO, nunca na redação (lição da A4: o rótulo
    // muda e o oráculo defasa). SIMPLIFICAÇÃO DE 23/08 (decisão do
    // Fundador): "Sua Jornada" saiu do menu — a régua dos seis marcos já
    // vive na Home, com o link para o histórico —, e "Perfil" virou "Meus
    // dados" porque disputava nome com o Mapa de Prioridades. A rota da
    // Jornada continua existindo; o que saiu foi a repetição no menu.
    const destinos = within(desktopNav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    // CORTE FUNDO + MERGE DE 23/08 (decisão do Fundador): o menu foi a
    // quatro itens e depois a TRÊS — o Início passou a SER a Curadoria
    // (`/paciente/curadoria` redireciona), e "Documentos" é encontrado em
    // "Meus dados". Nenhuma rota caiu; caíram os endereços duplicados.
    expect(destinos).toEqual([
      "/paciente",
      "/sua-historia/continuar",
      "/paciente/perfil",
    ]);
    expect(destinos, "a Jornada voltou a repetir no menu").not.toContain(
      "/paciente/linha-do-tempo",
    );
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
      within(desktopNav).getByRole("link", { name: "Meus dados" }),
    ).not.toHaveAttribute("aria-current");
  });
});
