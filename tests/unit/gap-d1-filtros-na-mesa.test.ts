import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * T-11-9 · GAP-D-1 FECHADO — a fase Filtros do COS ganhou porta.
 *
 * `mandatory-filters.tsx` foi escrito para curar um defeito de action órfã e
 * ficou, ele mesmo, órfão: zero importadores, três actions reais chamadas por
 * ninguém, e `actions-have-callers` passando **porque o arquivo órfão continha
 * as strings**. Era a quarta ocorrência da mesma classe, depois de
 * `CuradoriaDecisionPanel`, `SemCuradoria` e `WhatsappContact`.
 *
 * A prova aqui é de **composição**, não de import: o grafo sozinho não
 * distingue importar de renderizar — foi exatamente essa distinção que faltava.
 * Por isso a guarda decisiva lê o slot `PERFIL` da rota e exige o JSX.
 */

const RAIZ = process.cwd();
const SRC = path.join(RAIZ, "src");
const APP = path.join(SRC, "app");
const COMPONENTE = path.join(SRC, "components/curadoria/mandatory-filters.tsx");
const ROTA = "src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const completo = path.join(dir, entrada);
    if (statSync(completo).isDirectory()) return arquivos(completo);
    return /\.tsx?$/.test(entrada) ? [completo] : [];
  });
}

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

/** O corpo do slot `PERFIL`, do rótulo até o começo do slot seguinte. */
function slotPerfil(): string {
  const fonte = readFileSync(path.join(RAIZ, ROTA), "utf8");
  const ini = fonte.indexOf("    PERFIL:");
  const fim = fonte.indexOf("    REDE:", ini);
  expect(ini, "o slot PERFIL sumiu da rota").toBeGreaterThan(-1);
  expect(fim, "o slot REDE sumiu da rota").toBeGreaterThan(ini);
  return fonte.slice(ini, fim);
}

describe("T-11-9 · os filtros são alcançáveis PELA ROTA", () => {
  it("o componente é alcançado pelo grafo de imports de src/app", () => {
    const alcancaveis = alcancavelDeApp();
    expect(alcancaveis.size, "grafo vazio faria tudo passar em falso").toBeGreaterThan(50);
    expect(
      alcancaveis.has(COMPONENTE),
      "mandatory-filters voltou a ser inalcançável a partir de src/app",
    ).toBe(true);
  });

  /**
   * A guarda que M-11-4 derruba. Import é condição necessária e **não
   * suficiente**: um componente importado e não renderizado continua sendo
   * capacidade enterrada, com a aparência de integrada.
   */
  it("a Mesa RENDERIZA o painel dentro da etapa PERFIL", () => {
    expect(
      slotPerfil(),
      "o JSX de MandatoryFilters saiu do slot PERFIL — importar não é renderizar, " +
        "e foi essa confusão que manteve a fase Filtros invisível",
    ).toContain("<MandatoryFilters");
  });

  it("o painel recebe o Perfil de Prioridades, que é onde o ato mora", () => {
    const slot = slotPerfil();
    expect(slot, "sem priorityProfileId o painel não sabe onde registrar").toContain(
      "priorityProfileId={record.priorityProfileId}",
    );
    // Depois de reconhecido, o Perfil é imutável — corrigir exige construir um
    // novo, e a interface diz isso em vez de deixar o Curador tentar.
    expect(slot).toContain("readOnly={view.profileAcknowledged}");
  });

  it("as três actions dos filtros existem e são chamadas pelo painel", () => {
    const componente = readFileSync(COMPONENTE, "utf8");
    for (const action of [
      "addMandatoryFilterAction",
      "addPreferenceAction",
      "removeFilterAction",
    ]) {
      expect(componente, `${action} perdeu o chamador`).toContain(action);
    }
  });

  it("GAP-D-1 saiu da allowlist de órfãos, e restaram OITO", () => {
    const detector = readFileSync(
      path.join(RAIZ, "tests/unit/track-d-detector-de-orfaos.test.ts"),
      "utf8",
    );
    const entradas = [...detector.matchAll(/^  "src\/components\/[^"]+":$/gm)];
    // 23/08 · 8 → 13: a copy congelada do dossiê entrou (cinco entradas, cada
    // uma com motivo, ver o detector) — decisão registrada, não deriva.
    expect(entradas, "a allowlist mudou de tamanho sem decisão").toHaveLength(13);
    // Só as CHAVES. A prosa do arquivo cita `mandatory-filters` de propósito,
    // contando por que ele esteve enterrado — memória não é reincidência.
    expect(
      entradas.map((m) => m[0]).join("\n"),
      "a entrada obsoleta continua na allowlist — o órfão deixou de ser órfão",
    ).not.toContain("mandatory-filters");
  });
});
