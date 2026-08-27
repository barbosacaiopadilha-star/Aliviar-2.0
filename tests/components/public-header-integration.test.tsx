import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicHeader } from "@/components/landing/public-header";

// Integração Motor→Composição (Etapa 9, Parte 11): prova que PublicHeader
// realmente consome `shouldCompactHeader` sob um evento de scroll real, não
// só que o motor está correto isoladamente (já coberto por
// tests/unit/header-compaction.test.ts) nem que a composição compila.
// Não duplica nenhum caso já coberto ali.

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", {
      value: y,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("scroll"));
  });
}

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "scrollY", {
    value: 0,
    writable: true,
    configurable: true,
  });
});

describe("PublicHeader consumindo o Motor de Compactação", () => {
  it("estado inicial (scrollY = 0, abaixo do limiar): expandido", () => {
    const { container } = render(<PublicHeader />);
    const capsula = container.querySelector("header")?.querySelector("div");
    expect(capsula?.className).toContain("min-h-[4.25rem]");
    expect(capsula?.className).not.toContain("min-h-[3.25rem]");
  });

  /**
   * A régua da compactação passou a ser a ALTURA, não a sombra.
   *
   * Até 27/08 o `<header>` era a própria barra, e ganhava sombra ao rolar. Com
   * a cápsula da ADR-098 ele virou só o TRILHO: quem desenha — fundo, borda e
   * sombra — é o invólucro de dentro. O comportamento não mudou; mudou o
   * elemento que o carrega.
   *
   * Medir pela altura é melhor do que era antes: ela é o efeito que a pessoa
   * de fato percebe, e não muda quando o acabamento for recalibrado.
   */
  it("scroll real além do limiar compacta o header", () => {
    const { container } = render(<PublicHeader />);
    scrollTo(50);

    const capsula = container.querySelector("header")?.querySelector("div");
    expect(capsula?.className).toContain("min-h-[3.25rem]");
    expect(capsula?.className).not.toContain("min-h-[4.25rem]");
  });

  it("scroll de volta ao topo reverte para expandido — sem histerese", () => {
    const { container } = render(<PublicHeader />);
    scrollTo(50);
    scrollTo(0);

    const capsula = container.querySelector("header")?.querySelector("div");
    expect(capsula?.className).toContain("min-h-[4.25rem]");
    expect(capsula?.className).not.toContain("min-h-[3.25rem]");
  });

  it("desligamento simétrico: mount registra um listener de scroll, unmount o remove", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<PublicHeader />);
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), {
      passive: true,
    });
    const [, registeredListener] = addSpy.mock.calls.find(
      ([type]) => type === "scroll",
    )!;

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", registeredListener);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("mostra Entrar quando não há sessão", () => {
    const { getByRole } = render(<PublicHeader />);
    expect(getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  });

  it("substitui Entrar pelo portal autenticado quando há sessão", () => {
    const { getByRole, queryByRole } = render(
      <PublicHeader portalCta={{ label: "Minha Jornada", href: "/paciente" }} />,
    );

    expect(queryByRole("link", { name: "Entrar" })).toBeNull();
    expect(getByRole("link", { name: "Minha Jornada" })).toHaveAttribute("href", "/paciente");
  });
});
