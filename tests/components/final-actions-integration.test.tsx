import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CARDS } from "@/components/landing/faq-cards";
import { FinalActions } from "@/components/landing/final-actions";
import { FinalCtaSection } from "@/components/landing/final-cta-section";

// LAND DO PACIENTE — Fase 10, Decisão 1: prova, ao vivo (renderização
// real, não leitura de arquivo), que a remoção do CTA de WhatsApp não
// deixa a composição quebrada — um único CTA funcional, sem espaço ou
// hierarquia quebrados.

class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
// @ts-expect-error stub mínimo, só a forma usada por SectionReveal
window.IntersectionObserver = IntersectionObserverStub;

afterEach(cleanup);

describe("FinalActions — composição sem o CTA secundário", () => {
  it("renderiza exatamente um link, o CTA principal", () => {
    render(<FinalActions />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/sua-historia");
    expect(links[0]).toHaveTextContent("Contar minha história");
  });

  it("nenhum link renderizado aponta para wa.me ou qualquer destino placeholder", () => {
    render(<FinalActions />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toMatch(/wa\.me/i);
      expect(href.length).toBeGreaterThan(0);
      expect(href).not.toBe("#");
    }
  });

  it("FinalCtaSection monta sem erro com um único CTA (hierarquia intacta)", () => {
    render(<FinalCtaSection />);
    expect(
      screen.getByText("Estamos aqui — sem pressa e sem urgência artificial."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("FaqBookSection (modo estático) — carta 3 reescrita ao vivo", () => {
  it("todas as 6 cartas aparecem, incluindo a nova carta 3, sem menção a Busca Direta", async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;

    const { FaqBookSection } =
      await import("@/components/landing/faq-book-section");
    render(<FaqBookSection />);

    for (const card of CARDS) {
      expect(screen.getByText(card.duvidaTitle.join(" "))).toBeInTheDocument();
    }
    expect(screen.getByText(CARDS[2].solucaoText)).toBeInTheDocument();
    expect(screen.queryByText(/busca direta/i)).not.toBeInTheDocument();
  });
});
