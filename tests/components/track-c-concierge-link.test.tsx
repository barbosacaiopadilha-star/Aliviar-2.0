import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConciergeLink } from "@/components/paciente/concierge-link";

/**
 * T-C-1 · O RÓTULO, O DESTINO E O AVISO.
 *
 * O contrato 30 §3 resolve uma contradição real: [09] §1 lista assuntos e o
 * código usava o assunto como RÓTULO. Vence o §2 — o rótulo é sempre
 * *Falar com a Aliviar*, e o assunto vive na mensagem.
 *
 * As guardas abaixo caem se o rótulo virar "WhatsApp", se surgir horário ou
 * SLA, se a copy prometer contato já iniciado, se o link perder nome
 * acessível ou se o alvo mínimo for removido.
 */

afterEach(cleanup);

describe("T-C-1 · ConciergeLink", () => {
  it("o rótulo é sempre o mesmo, e diz Aliviar — nunca WhatsApp", () => {
    render(<ConciergeLink topic="curadoria" />);

    const link = screen.getByRole("link", { name: /Falar com a Aliviar/ });

    // O texto VISÍVEL é só o rótulo: o aviso de aba mora num `sr-only` à parte.
    // Trocar o rótulo por "WhatsApp" derruba esta linha.
    const visivel = [...link.childNodes]
      .filter((no) => !(no instanceof HTMLElement && no.classList.contains("sr-only")))
      .map((no) => no.textContent ?? "")
      .join("");
    expect(visivel.trim()).toBe("Falar com a Aliviar");

    // O nome acessível existe e é exatamente o esperado, com o aviso de aba.
    expect(link).toHaveAccessibleName("Falar com a Aliviar (abre o WhatsApp em nova aba)");
  });

  it("o aviso de nova aba é dito ANTES do clique, e é invisível", () => {
    const { container } = render(<ConciergeLink topic="jornada" />);

    const aviso = container.querySelector(".sr-only");
    expect(aviso, "sem o aviso, quem usa leitor de tela descobre a aba nova depois").not.toBeNull();
    expect(aviso).toHaveTextContent("(abre o WhatsApp em nova aba)");
  });

  it("abre em nova aba, sem entregar a janela de origem", () => {
    render(<ConciergeLink topic="documento" />);

    const link = screen.getByRole("link", { name: /Falar com a Aliviar/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("o destino vem da fonte única e carrega o assunto, nunca conteúdo", () => {
    render(<ConciergeLink topic="curadoria" />);

    const href = screen
      .getByRole("link", { name: /Falar com a Aliviar/ })
      .getAttribute("href")!;
    expect(href).toContain("wa.me/5511979037133");
    expect(decodeURIComponent(href)).toContain(
      "Oi! Gostaria de conversar sobre a minha Curadoria.",
    );
  });

  it("o alvo mínimo de 44px está declarado", () => {
    render(<ConciergeLink topic="jornada" />);

    // jsdom não faz layout: a prova possível aqui é a classe que garante a
    // altura. A medição real em pixels é do e2e (T-C-7), na P3.
    expect(
      screen.getByRole("link", { name: /Falar com a Aliviar/ }).className,
      "min-h-11 é o alvo de 44px — removê-lo derruba este teste",
    ).toContain("min-h-11");
  });

  it("não promete horário, prazo nem atendimento já iniciado", () => {
    const { container } = render(<ConciergeLink topic="jornada" nota />);
    const texto = container.textContent ?? "";

    for (const proibida of [
      "horário",
      "atendimento",
      "iniciar atendimento",
      "responderemos em",
      "minutos",
      "24h",
      "48h",
      "úteis",
      "imediat",
      "agora mesmo",
    ]) {
      expect(texto.toLowerCase(), `promessa proibida na copy: ${proibida}`).not.toContain(
        proibida.toLowerCase(),
      );
    }
  });

  it("a frase institucional substitui o horário — e só aparece quando pedida", () => {
    const { container: sem } = render(<ConciergeLink topic="curadoria" />);
    expect(sem.textContent).not.toContain("Sem pressa");

    cleanup();

    const { container: com } = render(<ConciergeLink topic="curadoria" nota />);
    expect(com.textContent).toContain("Sem pressa — responderemos.");
  });
});
