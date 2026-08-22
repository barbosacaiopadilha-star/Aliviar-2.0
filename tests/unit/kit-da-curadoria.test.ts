import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { KIT_DA_CURADORIA } from "@/components/admin/kit-da-curadoria-card";

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
});
