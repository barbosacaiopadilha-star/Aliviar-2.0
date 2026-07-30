import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NC-24 — MÓDULO IMPORTÁVEL NÃO TEM SHEBANG.
 *
 * O vite-node transforma o módulo e o executa em `vm.Script`, que rejeita
 * `#!` com "SyntaxError: Invalid or unexpected token". Um `#!` num arquivo
 * que a suíte importa derruba tudo o que depende dele — foi assim que o
 * `setup-env`, o `globalSetup` da integração e o teste do próprio guarda
 * pararam de carregar, e a suíte de integração inteira ficou inexecutável.
 *
 * A regra é simples e verificável: quem é importado não tem shebang; quem é
 * executado pela linha de comando tem. Este teste guarda a fronteira.
 */

const RAIZ = process.cwd();

function arquivosMjs(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return arquivosMjs(caminho);
    return entrada.name.endsWith(".mjs") ? [caminho] : [];
  });
}

function temShebang(relativo: string): boolean {
  return readFileSync(join(RAIZ, relativo), "utf8").startsWith("#!");
}

/** Fontes que a suíte carrega: testes, setups e configs do Vitest. */
function fontesQueImportam(): { arquivo: string; texto: string }[] {
  const alvos: { arquivo: string; texto: string }[] = [];

  const varrer = (dir: string) => {
    for (const entrada of readdirSync(join(RAIZ, dir), { withFileTypes: true })) {
      const caminho = `${dir}/${entrada.name}`;
      if (entrada.isDirectory()) varrer(caminho);
      else if (/\.(ts|tsx|mts)$/.test(entrada.name)) {
        alvos.push({ arquivo: caminho, texto: readFileSync(join(RAIZ, caminho), "utf8") });
      }
    }
  };

  varrer("tests");
  for (const config of readdirSync(RAIZ).filter((n) => /^vitest\..*\.ts$/.test(n) || n === "vitest.config.ts")) {
    alvos.push({ arquivo: config, texto: readFileSync(join(RAIZ, config), "utf8") });
  }
  return alvos;
}

describe("A fronteira entre biblioteca e executável", () => {
  const scripts = arquivosMjs("scripts");

  it("existem scripts .mjs para auditar", () => {
    expect(scripts.length).toBeGreaterThan(3);
  });

  it("nenhum módulo importado pela suíte tem shebang", () => {
    const importados = new Set<string>();

    for (const { texto } of fontesQueImportam()) {
      for (const match of texto.matchAll(/from\s+"([^"]+\.mjs)"/g)) {
        const alvo = match[1]!;
        // Resolve o caminho relativo ao repositório, qualquer que seja a
        // profundidade do arquivo que importa.
        const nome = alvo.split("/").pop()!;
        const encontrado = scripts.find((s) => s.endsWith(`/${nome}`));
        if (encontrado) importados.add(encontrado);
      }
    }

    expect(importados.size).toBeGreaterThan(0);

    for (const modulo of importados) {
      expect(
        temShebang(modulo),
        `${modulo} é importado pela suíte e tem shebang — o vite-node vai recusá-lo em vm.Script (NC-24)`,
      ).toBe(false);
    }
  });

  it("o guarda de ambiente continua sendo biblioteca — sem shebang e sem execução automática", () => {
    const guarda = readFileSync(join(RAIZ, "scripts/env-guard.mjs"), "utf8");
    expect(guarda.startsWith("#!")).toBe(false);
    // Só declarações: nada que rode ao importar.
    expect(guarda).not.toMatch(/^\s*(main|run|await)\s*\(/m);
    expect(guarda).not.toMatch(/^process\.(exit|argv)/m);
  });

  it("wrapper executado pelo npm pode ter shebang — e nunca é importado pela suíte", () => {
    // A regra da NC-24 é de mão única: shebang é livre em quem só executa;
    // proibido em quem é importado. (`node arquivo.mjs` dispensa shebang — ele
    // só importa para execução direta em Unix —, então não se exige aqui.)
    const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const executados = new Set<string>();
    for (const comando of Object.values(pkg.scripts)) {
      for (const match of comando.matchAll(/node\s+(scripts\/[\w./-]+\.mjs)/g)) {
        executados.add(match[1]!);
      }
    }

    expect(executados.size).toBeGreaterThan(0);

    const importadosPelaSuite = fontesQueImportam()
      .flatMap(({ texto }) => [...texto.matchAll(/from\s+"([^"]+\.mjs)"/g)].map((m) => m[1]!))
      .map((caminho) => caminho.split("/").pop()!);

    for (const wrapper of executados) {
      const nome = wrapper.split("/").pop()!;
      if (!temShebang(wrapper)) continue; // sem shebang, não há fronteira a violar
      expect(
        importadosPelaSuite.includes(nome),
        `${wrapper} tem shebang e é importado pela suíte — separe a biblioteca do executável (NC-24)`,
      ).toBe(false);
    }
  });
});
