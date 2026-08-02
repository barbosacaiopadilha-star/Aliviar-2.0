import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A campanha não entra no quarto onde alguém se abre.
 *
 * A Recepção ("Sua História") compartilha a moldura pública com a Landing e,
 * até a validação 2.4, herdava também o rodapé institucional: quem rolava
 * além do "Continuar" na pergunta sobre o próprio medo encontrava logotipo,
 * navegação e copyright — a voz da fachada dentro da conversa íntima.
 *
 * Estes guardas são de fonte porque o que se protege é estrutura de
 * composição: o rodapé institucional só existe através do gate por rota, e o
 * gate exclui a Recepção. Se alguém remover o gate "para simplificar", o
 * teste diz exatamente o que voltaria a acontecer.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf-8");
}

describe("Recepção sem a voz da campanha", () => {
  it("o layout público renderiza o rodapé através do gate, nunca direto", () => {
    const layout = read("src/app/(public)/layout.tsx");
    expect(layout).toContain("PublicFooterGate");
    expect(layout, "o rodapé voltou a ser incondicional no layout público").not.toMatch(
      /<PublicFooter\s*\/>/,
    );
  });

  it("o gate exclui a Recepção inteira", () => {
    const gate = read("src/components/landing/public-footer-gate.tsx");
    expect(gate).toContain('pathname.startsWith("/sua-historia")');
    expect(gate).toContain("return null");
    // E continua entregando o rodapé para a Fachada.
    expect(gate).toContain("<PublicFooter />");
  });

  it("nenhuma tela da Recepção importa o rodapé institucional por conta própria", () => {
    const paginas = [
      "src/app/(public)/sua-historia/page.tsx",
      "src/app/(public)/sua-historia/(wizard)/layout.tsx",
    ];
    for (const p of paginas) {
      expect(read(p), `${p} importa PublicFooter`).not.toContain("PublicFooter");
    }
  });
});
