import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { CARDS } from "@/components/landing/faq-cards";
import { MARK_PROGRESS } from "@/components/landing/faq-book-turn";

// Integração Motor→Composição + regressão de hardening (Etapa 9, Parte 11
// e achado da Parte 4/Correções Permitidas): duas coisas que só se provam
// montando o componente real, nunca reimplementando a lógica em outro
// lugar — (1) o guard `cancelled` adicionado em faq-book-section.tsx
// realmente impede que um `gsap.context`/ScrollTrigger seja criado depois
// que o efeito já foi desmontado (a corrida que existia antes desta
// etapa); (2) `advance()` realmente consome `getFaqCardTargetScroll`
// (faq-book-turn.ts) de ponta a ponta, não um valor recalculado à parte.
//
// GSAP é mockado (jsdom não tem as APIs de scroll/layout reais que
// ScrollTrigger precisa, e nenhum outro teste deste projeto monta um
// componente que usa GSAP de verdade) — o mock reproduz só a forma
// mínima da API realmente usada por faq-book-section.tsx
// (gsap.context/gsap.timeline/timeline.to/timeline.scrollTrigger), nunca
// o comportamento visual do GSAP em si, que não é o que este teste
// verifica.

const { gsapContextMock, revertMock, timelineToMock } = vi.hoisted(() => ({
  gsapContextMock: vi.fn(),
  revertMock: vi.fn(),
  timelineToMock: vi.fn(),
}));

let releaseImport: () => void = () => {};
const importGate = new Promise<void>((resolve) => {
  releaseImport = resolve;
});

vi.mock("gsap", async () => {
  await importGate;
  return {
    gsap: {
      registerPlugin: vi.fn(),
      context: (fn: () => void, scope?: unknown) => {
        gsapContextMock(scope);
        fn();
        return { revert: revertMock };
      },
      timeline: () => {
        const timeline = {
          to: (...args: unknown[]) => {
            timelineToMock(...args);
            return timeline;
          },
          // Alcance de scroll arbitrário (0 a 1) — mesma forma real de
          // `timeline.scrollTrigger.start/end` que `advance()` lê ao vivo;
          // valores simples tornam o alvo esperado igual ao próprio
          // MARK_PROGRESS (scrollRangeStart=0, scrollRangeEnd=1).
          scrollTrigger: { start: 0, end: 1 },
        };
        return timeline;
      },
    },
  };
});

vi.mock("gsap/ScrollTrigger", async () => {
  await importGate;
  return { ScrollTrigger: {} };
});

class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
  // @ts-expect-error stub mínimo, só a forma usada por SectionReveal
  window.IntersectionObserver = IntersectionObserverStub;
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("efeito GSAP desmontado antes do import resolver (regressão do guard `cancelled`)", () => {
  it("nunca cria um gsap.context depois que o componente já foi desmontado", async () => {
    const { FaqBookSection } =
      await import("@/components/landing/faq-book-section");
    const { unmount } = render(<FaqBookSection />);

    // Desmonta ANTES de liberar o import — reproduz exatamente a corrida
    // que o React Strict Mode expõe a cada carga em desenvolvimento
    // (mount → efeito agenda o import → cleanup roda antes do import
    // resolver).
    unmount();
    releaseImport();
    await importGate;
    // Deixa a IIFE assíncrona dentro do efeito retomar e checar `cancelled`.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(gsapContextMock).not.toHaveBeenCalled();
    expect(revertMock).not.toHaveBeenCalled();
  });
});

describe("montagem normal (import já resolvido) — consumo real do Motor de Virada", () => {
  it("cria o gsap.context normalmente quando o efeito não é cancelado", async () => {
    const { FaqBookSection } =
      await import("@/components/landing/faq-book-section");
    render(<FaqBookSection />);

    await waitFor(() => expect(gsapContextMock).toHaveBeenCalledTimes(1));
    // Assentamento inicial + 5 transições reais (CARDS.length - 1) + saída
    // + assentamento final: confirma que a timeline real foi montada, não
    // uma versão vazia.
    expect(timelineToMock.mock.calls.length).toBeGreaterThan(CARDS.length);
  });

  it("advance() por clique usa getFaqCardTargetScroll — mesmo alvo, nunca recalculado à parte", async () => {
    const { FaqBookSection } =
      await import("@/components/landing/faq-book-section");
    render(<FaqBookSection />);
    await waitFor(() => expect(gsapContextMock).toHaveBeenCalled());

    const book = screen.getByRole("group");
    act(() => {
      fireEvent.click(book);
    });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: MARK_PROGRESS[1],
      behavior: "smooth",
    });
  });

  it("advance() por teclado (seta direita) usa o mesmo motor que o clique", async () => {
    const { FaqBookSection } =
      await import("@/components/landing/faq-book-section");
    render(<FaqBookSection />);
    await waitFor(() => expect(gsapContextMock).toHaveBeenCalled());

    const book = screen.getByRole("group");
    act(() => {
      fireEvent.keyDown(book, { key: "ArrowRight" });
    });

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: MARK_PROGRESS[1],
      behavior: "smooth",
    });
  });
});
