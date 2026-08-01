import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Os fundos da casa pertencem à mesma instituição.
 *
 * Estes guardas nascem da Auditoria da Experiência Visual: a área da equipe
 * abria com "Sistema Operacional" (fala de software, não de instituição), e
 * a porta errada era HTML cru — a única superfície sem nenhum cuidado. São
 * testes de fonte porque o que se protege é vocabulário e material, não
 * comportamento.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf-8");
}

describe("Fundos da casa — a instituição, não o software", () => {
  it('nenhuma superfície de equipe se apresenta como "Sistema Operacional"', () => {
    const shell = read("src/components/shell/app-shell.tsx");
    expect(shell).not.toContain("Sistema Operacional");
  });

  it("o rótulo da casa e os grupos de navegação não gritam em caixa alta", () => {
    const shell = read("src/components/shell/app-shell.tsx");
    // A caixa alta reduz a legibilidade de quem lê sob pressão (F2 §6.2).
    // O rótulo continua distinto por peso, tamanho e cor.
    const cabecalho = shell.slice(shell.indexOf("function ShellNav"), shell.indexOf("export function AppShell"));
    expect(cabecalho).not.toContain("uppercase");
  });

  it("o painel do administrador não usa vermelho para julgar um número", () => {
    // Vermelho é cor de erro; um contador alto é fato que pede ação, não
    // falha de alguém (F2 R2 — nada de semáforo).
    const painel = read("src/app/admin/page.tsx");
    expect(painel).not.toContain("text-error");
  });
});

/** O que a pessoa lê — comentários do código não chegam à tela. */
function semComentarios(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("A porta errada — acesso negado", () => {
  const fonte = read("src/app/acesso-negado/page.tsx");
  const pagina = semComentarios(fonte);

  it("pertence à casa: tem tipografia, espaço e caminho de volta", () => {
    expect(pagina).toContain("font-serif");
    expect(pagina).toContain("Voltar para a minha área");
    expect(pagina).toContain("getRoleHome");
  });

  it("não expõe nenhum detalhe de autorização", () => {
    const texto = pagina.toLowerCase();
    for (const proibido of ["policy", "rls", "permissão negada", "role:", "unauthorized", "403"]) {
      expect(texto, `detalhe técnico exposto: ${proibido}`).not.toContain(proibido);
    }
  });

  it("não acusa quem chegou", () => {
    const texto = pagina.toLowerCase();
    for (const proibido of ["você não pode", "proibido", "sem permissão", "não autorizado"]) {
      expect(texto, `acusação: ${proibido}`).not.toContain(proibido);
    }
  });

  it("funciona sem JavaScript — nenhum estado, nenhum client component", () => {
    expect(pagina).not.toContain('"use client"');
    expect(pagina).not.toContain("useState");
    expect(pagina).not.toContain("onClick");
  });
});
