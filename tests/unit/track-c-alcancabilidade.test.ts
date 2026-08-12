import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * T-C-10 · ALCANÇABILIDADE — não existência.
 *
 * A lição da B3, aplicada antes de o defeito se repetir: um teste que importa
 * o componente prova que ele funciona, **nunca** que alguém o alcança. A régua
 * é o grafo de imports a partir de `src/app` — órfão não conta.
 *
 * E órfão é exatamente o que já havia: `WhatsappContact` existe, funciona, e
 * seu único importador (`SemCuradoria`) não é renderizado por lugar nenhum
 * (contrato 30 §2.1). Esta guarda impede que `ConciergeLink` tenha o mesmo
 * destino.
 */

const RAIZ = path.resolve(__dirname, "../..");
const SRC = path.join(RAIZ, "src");
const APP = path.join(SRC, "app");
const CONCIERGE = path.join(SRC, "components/paciente/concierge-link.tsx");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

/** Resolve um especificador para um arquivo real do projeto, ou null. */
function resolver(especificador: string, deOnde: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = path.join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = path.resolve(path.dirname(deOnde), especificador);
  else return null;

  for (const tentativa of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    try {
      if (statSync(tentativa).isFile()) return tentativa;
    } catch {
      // caminho inexistente — segue tentando
    }
  }
  return null;
}

function alcancavelDeApp(): Set<string> {
  const vistos = new Set<string>();
  const fila = arquivos(APP);

  while (fila.length) {
    const atual = fila.pop()!;
    if (vistos.has(atual)) continue;
    vistos.add(atual);

    const codigo = readFileSync(atual, "utf8");
    for (const re of [/from\s+["']([^"']+)["']/g, /import\(\s*["']([^"']+)["']\s*\)/g]) {
      for (const m of codigo.matchAll(re)) {
        const destino = resolver(m[1]!, atual);
        if (destino && !vistos.has(destino)) fila.push(destino);
      }
    }
  }
  return vistos;
}

describe("T-C-10 · alcançabilidade a partir da rota", () => {
  const alcancaveis = alcancavelDeApp();

  it("o grafo enxerga as páginas e o que elas importam", () => {
    // Sanidade: grafo vazio faria a guarda abaixo passar em falso.
    expect(alcancaveis.size).toBeGreaterThan(50);
  });

  it("ConciergeLink é alcançado por alguma página de src/app", () => {
    expect(
      alcancaveis.has(CONCIERGE),
      "componente órfão: existe, funciona, e ninguém chega nele — foi assim que " +
        "CuradoriaDecisionPanel ficou fora da rota com as suítes verdes",
    ).toBe(true);
  });

  it("as seis rotas da paciente alcançam a porta, uma a uma", () => {
    const rotas = [
      "src/app/paciente/page.tsx",
      "src/app/paciente/curadoria/page.tsx",
      "src/app/paciente/linha-do-tempo/page.tsx",
      "src/app/paciente/documentos/page.tsx",
      "src/app/paciente/perfil/page.tsx",
      "src/app/paciente/documentos-e-consentimentos/page.tsx",
    ];

    for (const rota of rotas) {
      const arquivo = path.join(RAIZ, rota);
      const codigo = readFileSync(arquivo, "utf8");
      expect(codigo, `${rota} não importa a porta`).toContain(
        '@/components/paciente/concierge-link',
      );
      // Import é condição necessária e NÃO suficiente — quem prova o render é
      // `track-c-composicao-das-rotas`. Aqui só se afirma o alcance.
      expect(codigo, `${rota} importa e não usa`).toContain("<ConciergeLink");
    }
  });
});
