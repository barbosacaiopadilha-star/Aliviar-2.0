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
    const header = container.querySelector("header");
    expect(header?.className).not.toContain("shadow-md");
    expect(header?.querySelector("div")?.className).toContain("min-h-16");
  });

  it("scroll real além do limiar compacta o header", () => {
    const { container } = render(<PublicHeader />);
    scrollTo(50);

    const header = container.querySelector("header");
    expect(header?.className).toContain("shadow-md");
    expect(header?.querySelector("div")?.className).toContain("min-h-14");
  });

  it("scroll de volta ao topo reverte para expandido — sem histerese", () => {
    const { container } = render(<PublicHeader />);
    scrollTo(50);
    scrollTo(0);

    const header = container.querySelector("header");
    expect(header?.className).not.toContain("shadow-md");
    expect(header?.querySelector("div")?.className).toContain("min-h-16");
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
});
