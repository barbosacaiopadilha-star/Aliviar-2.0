import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePortalRawProgress } from "@/components/landing/use-portal-raw-progress";

// Integração Motor→Composição (Etapa 9, Parte 11 — "desmontagem sem loop
// restante", "remount sem duplicação"): prova que o Motor de Progresso
// Bruto (o único relógio de quadro do Portal) realmente inicia e desliga
// de forma simétrica através do ciclo de vida real do React — mount,
// unmount, remount — não só que a matemática interna está certa (não há
// matemática aqui: este motor só agenda/cancela rAF + observer).

class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    IntersectionObserverStub.instances.push(this);
  }
}

function Harness({
  enabled,
  onFrame,
}: {
  enabled: boolean;
  onFrame: (overall: number, now: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  usePortalRawProgress(ref, enabled, onFrame);
  return <section ref={ref} data-testid="section" />;
}

let rafSeq = 0;
const pendingRaf = new Set<number>();

beforeEach(() => {
  IntersectionObserverStub.instances = [];
  window.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;

  rafSeq = 0;
  pendingRaf.clear();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => {
    rafSeq += 1;
    pendingRaf.add(rafSeq);
    return rafSeq;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
    pendingRaf.delete(id);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("usePortalRawProgress — lifecycle real", () => {
  it("mount: agenda exatamente um quadro e observa a própria seção", () => {
    render(<Harness enabled onFrame={vi.fn()} />);

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(pendingRaf.size).toBe(1);
    expect(IntersectionObserverStub.instances).toHaveLength(1);
    expect(IntersectionObserverStub.instances[0].observe).toHaveBeenCalledTimes(
      1,
    );
  });

  it("desligamento simétrico: unmount cancela o quadro pendente e desconecta o observer", () => {
    const { unmount } = render(<Harness enabled onFrame={vi.fn()} />);
    const observer = IntersectionObserverStub.instances[0];

    unmount();

    expect(pendingRaf.size).toBe(0);
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("enabled=false: nunca agenda quadro nem observer — motor pausado nunca gasta ciclo", () => {
    render(<Harness enabled={false} onFrame={vi.fn()} />);

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(IntersectionObserverStub.instances).toHaveLength(0);
  });

  it("remount não duplica mecanismos: cada ciclo mount→unmount→mount deixa só um quadro pendente e um observer vivo por vez", () => {
    const first = render(<Harness enabled onFrame={vi.fn()} />);
    expect(pendingRaf.size).toBe(1);
    expect(IntersectionObserverStub.instances).toHaveLength(1);

    first.unmount();
    expect(pendingRaf.size).toBe(0);
    expect(
      IntersectionObserverStub.instances[0].disconnect,
    ).toHaveBeenCalledTimes(1);

    render(<Harness enabled onFrame={vi.fn()} />);
    // Um segundo observer nasce para a segunda montagem — o primeiro
    // permanece desconectado (não é reanimado), nunca há dois observers
    // simultaneamente ativos.
    expect(IntersectionObserverStub.instances).toHaveLength(2);
    expect(pendingRaf.size).toBe(1);
  });

  it("toggle de enabled true→false→true não deixa rAF/observer órfão de nenhuma fase intermediária", () => {
    const { rerender } = render(<Harness enabled onFrame={vi.fn()} />);
    expect(pendingRaf.size).toBe(1);

    rerender(<Harness enabled={false} onFrame={vi.fn()} />);
    expect(pendingRaf.size).toBe(0);
    expect(
      IntersectionObserverStub.instances[0].disconnect,
    ).toHaveBeenCalledTimes(1);

    rerender(<Harness enabled onFrame={vi.fn()} />);
    expect(pendingRaf.size).toBe(1);
    expect(IntersectionObserverStub.instances).toHaveLength(2);
  });
});
