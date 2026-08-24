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

  // MERGE DE 23/08 · curadoria e consentimentos viraram redirects; a porta
  // delas mora nas rotas que as abrigam (Início e Documentos).
  // 24/08 ("não quero Concierge lá embaixo") · a porta da CASA INTEIRA
  // passou a ser o botão fixo no cabeçalho do PatientShell — a moldura que
  // toda rota da paciente veste. A guarda muda de forma, não de garantia.
  it("o cabeçalho da casa carrega a porta — para toda rota da paciente", () => {
    const shell = readFileSync(
      path.join(RAIZ, "src/components/paciente/patient-shell.tsx"),
      "utf8",
    );
    expect(shell).toContain("whatsappHref");
    expect(shell).toContain("Falar com a Aliviar");
  });

  it("as rotas com porta própria continuam com ela, uma a uma", () => {
    const rotas = [
      "src/app/paciente/linha-do-tempo/page.tsx",
      "src/app/paciente/documentos/page.tsx",
      "src/app/paciente/perfil/page.tsx",
    ];

    for (const rota of rotas) {
      const arquivo = path.join(RAIZ, rota);
      const codigo = readFileSync(arquivo, "utf8");
      // 24/08 (decisão do Fundador): a porta tem DUAS formas legítimas — a
      // linha discreta (ConciergeLink) e o card-ferramenta (ConciergeCard).
      // O que esta guarda afirma continua o mesmo: toda rota da paciente
      // alcança a porta por uma delas.
      const temPorta =
        (codigo.includes("@/components/paciente/concierge-link") &&
          codigo.includes("<ConciergeLink")) ||
        (codigo.includes("@/components/paciente/concierge-card") &&
          codigo.includes("<ConciergeCard"));
      expect(temPorta, `${rota} não importa (ou importa e não usa) a porta`).toBe(true);
    }
  });
});
