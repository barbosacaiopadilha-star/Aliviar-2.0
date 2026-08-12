import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import PaginaPublica from "@/app/(public)/page";

/**
 * T-D-4 · A LANDING VIVA SOBREVIVEU — provado pela rota, não pelo diretório.
 *
 * A Track D removeu 28 arquivos, e vinte e dois deles eram landing: o cluster
 * `portal-experience` / `faq-book-section` / `final-cta-section` / `v2/*` e sua
 * cascata. A pergunta que importa não é "o morto saiu?" — é **"o vivo ficou
 * inteiro?"**.
 *
 * Por isso a prova é a composição de `(public)/page.tsx`, e não a existência
 * dos arquivos: apagar por engano uma seção editorial deixaria o diretório
 * parecendo saudável e a página com um buraco.
 *
 * Este arquivo é a rede de M-D4 (remover `link-button.tsx` junto com a cascata)
 * e de M-D5 (trocar a viva pela morta).
 */

/**
 * `RevealGroup` pergunta ao navegador se a pessoa pediu menos animação. O jsdom
 * não implementa `matchMedia` — o stub responde "não pediu", que é o caminho
 * com MAIS coisa na tela e, portanto, o mais exigente para esta prova.
 */
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

/** As sete seções editoriais, na ordem em que a página as compõe. */
const SECOES = [
  "Problema",
  "Respiro",
  "Metodo",
  "Prioridades",
  "QuemSomos",
  "FaqCompact",
  "Convite",
] as const;

describe("T-D-4 · a landing pública, depois da limpeza", () => {
  it("renderiza sem quebrar — nenhum import ficou pendurado na cascata", () => {
    const { container } = render(<PaginaPublica />);
    expect(container.firstChild, "a página não montou").not.toBeNull();
  });

  it("o herói editorial está lá", () => {
    render(<PaginaPublica />);
    // O herói é o primeiro contato: se ele sumir, a página abre no vazio.
    expect(screen.getAllByRole("heading", { level: 1 }).length).toBeGreaterThan(0);
  });

  it("as sete seções editoriais continuam na composição", () => {
    const fonte = readFonteDaRota();
    for (const secao of SECOES) {
      expect(fonte, `a seção ${secao} saiu da composição`).toContain(`<${secao}Section`);
    }
    expect(fonte, "o herói saiu da composição").toContain("<HeroEditorial");
  });

  it("a rota pública não voltou a importar a landing morta", () => {
    const fonte = readFonteDaRota();
    for (const morto of [
      "portal-experience",
      "faq-book-section",
      "final-cta-section",
      "landing/v2",
      "golden-thread",
      "section-eyebrow",
      "video-section",
    ]) {
      expect(fonte, `a rota voltou a apontar para ${morto}`).not.toContain(morto);
    }
  });
});

/**
 * A fonte da rota, lida do disco.
 *
 * Renderizar prova que a página monta; ler a fonte prova QUAIS seções ela
 * compõe. As duas coisas juntas são o que M-D5 precisa derrubar — uma sozinha
 * deixaria passar a troca do vivo pelo morto.
 */
function readFonteDaRota(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path") as typeof import("node:path");
  return readFileSync(path.join(process.cwd(), "src/app/(public)/page.tsx"), "utf8");
}
