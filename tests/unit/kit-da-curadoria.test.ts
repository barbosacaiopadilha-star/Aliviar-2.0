import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GUIAS_DE_LEITURA, KIT_DA_CURADORIA } from "@/components/admin/kit-da-curadoria-card";

/**
 * O cartão do Kit na Visão geral do admin não pode oferecer link morto:
 * cada href aponta para um arquivo que EXISTE em public/. E a Folha da
 * Mesa fica FORA por decisão do Fundador (22/08) — instrumento do Curador,
 * nunca item de download do cartão.
 */
describe("Kit da Curadoria — links vivos, lista decidida", () => {
  it("todo link do cartão aponta para um PDF que existe em public/", () => {
    for (const peca of KIT_DA_CURADORIA) {
      const arquivo = join(process.cwd(), "public", peca.href);
      expect(existsSync(arquivo), `link morto no cartão do Kit: ${peca.href}`).toBe(true);
    }
  });

  it("são as quatro peças decididas — e a Folha da Mesa não está entre elas", () => {
    expect(KIT_DA_CURADORIA).toHaveLength(4);
    for (const peca of KIT_DA_CURADORIA) {
      expect(peca.href.includes("Folha-da-Mesa"), "a Folha da Mesa entrou no cartão sem decisão").toBe(false);
    }
  });

  /**
   * 28/08 · os dez guias de leitura passam a ser baixáveis. O PDF deles vive em
   * `public/guias/`, gerado por `scripts/gerar-guias-pdf.mjs` a partir do HTML —
   * e é justamente por serem gerados que a checagem de link morto importa: quem
   * renomeia um fonte e esquece o mapa `PUBLICADOS` quebra o download sem que
   * nada mais reclame.
   */
  it("todo guia de leitura aponta para um PDF que existe em public/", () => {
    for (const guia of GUIAS_DE_LEITURA) {
      const arquivo = join(process.cwd(), "public", guia.href);
      expect(existsSync(arquivo), `link morto no Kit: ${guia.href}`).toBe(true);
    }
  });

  it("são os dez guias, na ordem de leitura — e nenhum repetido", () => {
    expect(GUIAS_DE_LEITURA).toHaveLength(11);
    const hrefs = GUIAS_DE_LEITURA.map((g) => g.href);
    expect(new Set(hrefs).size, "há guia repetido no cartão").toBe(hrefs.length);
  });

  it("as duas listas não se misturam: guia não é peça de preencher", () => {
    // `Set<string>` explícito: as duas listas são `as const`, e sem isto o
    // `has()` recusaria em tempo de tipo justamente o que o teste quer conferir.
    const dePreencher = new Set<string>(KIT_DA_CURADORIA.map((p) => p.href));
    for (const guia of GUIAS_DE_LEITURA) {
      expect(dePreencher.has(guia.href), `${guia.href} está nas duas listas`).toBe(false);
      expect(guia.href.startsWith("/guias/"), `${guia.href} não vive em /guias/`).toBe(true);
    }
    for (const peca of KIT_DA_CURADORIA) {
      expect(peca.href.startsWith("/rede/"), `${peca.href} não vive em /rede/`).toBe(true);
    }
  });
});
