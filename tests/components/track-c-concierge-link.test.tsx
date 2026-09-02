import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { ALIVIAR_WHATSAPP } from "@/components/curadoria/whatsapp-contact";

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
    expect(href).toContain("wa.me/${ALIVIAR_WHATSAPP}");
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

/**
 * A PORTA NO TOPO NÃO PODE SUBIR JUNTO COM A ROLAGEM.
 *
 * A 2ª emenda da ADR-085 (24/08) tirou o card do Concierge do pé da página
 * — *"eu não quero Concierge lá embaixo"* — e o pôs como **botão fixo no
 * cabeçalho do shell, presente em TODA TELA**.
 *
 * O defeito que este oráculo existe para impedir: o shell declarava
 * `sticky top-0`, e a regra de empilhamento da folha da casa — a que põe o
 * conteúdo acima da camada da fotografia — incluía `header` e o rebaixava a
 * `position: relative` por especificidade (`.patient-dashboard > header`
 * vence `.sticky`). Em silêncio: nenhum teste falhava, a classe continuava
 * escrita no TSX, e a porta saía da tela na primeira rolagem.
 *
 * Ficou visível quando a leitura passou a começar abaixo da dobra da cena,
 * porque aí rolar deixou de ser opcional — mas o defeito já estava lá desde
 * que a fotografia entrou.
 */
describe("T-C-8 · a porta do Concierge fica no topo, sempre", () => {
  const CSS = readFileSync("src/app/patient-dashboard.css", "utf8");
  const SHELL = readFileSync("src/components/paciente/patient-shell.tsx", "utf8");

  it("o cabeçalho da casa é grudado — declarado na folha, não só no TSX", () => {
    const regra = CSS.slice(CSS.indexOf(".patient-dashboard > header {"));
    expect(regra.slice(0, 120)).toContain("position: sticky");
    expect(regra.slice(0, 120)).toContain("top: 0");
  });

  it("e a regra de empilhamento não volta a atropelar o cabeçalho", () => {
    // Era esta a lista que continha `header` e o rebaixava a `relative`.
    const empilha = CSS.slice(CSS.indexOf(".patient-dashboard > main,"));
    expect(empilha.slice(0, 160)).not.toContain("> header");
  });

  it("o botão continua no cabeçalho, com o rótulo único e o assunto tipado", () => {
    const cabecalho = SHELL.slice(SHELL.indexOf("<header"), SHELL.indexOf("</header>"));

    // O cabeçalho monta a porta em linha, não pelo ConciergeLink — o que a
    // torna a MESMA porta é o contrato, não o componente: rótulo único e
    // destino por assunto tipado, sem texto livre (contrato 30 §3 e §7).
    expect(cabecalho).toContain("Falar com a Aliviar");
    expect(cabecalho).toContain(String.raw`whatsappHref("jornada")`);
    expect(cabecalho).toContain("(abre o WhatsApp em nova aba)");
  });
});
