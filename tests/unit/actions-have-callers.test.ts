import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NENHUMA ACTION PRONTA SEM CHAMADOR.
 *
 * Por que este teste existe: a Curadoria tinha sete server actions completas —
 * comparar, salvar seleção, entregar, registrar decisão — sem uma única linha
 * de interface que as invocasse. Elas passavam em todo lint e em todo tsc,
 * porque código morto compila. O sintoma só aparecia para um Curador real,
 * travado no meio do processo, sem saber que a capacidade existia.
 *
 * Uma action sem chamador é uma promessa que o produto não cumpre. Este teste
 * transforma isso em falha de suíte: se alguém escrever a próxima action e
 * esquecer a tela, a build avisa antes do Curador.
 */

const ROOT = process.cwd();
const ACTION_MODULES = [
  "src/modules/curadoria/actions.ts",
  "src/modules/briefing/actions.ts",
  "src/modules/cases/actions.ts",
  "src/modules/cases/responsibility-actions.ts",
];

/** Onde uma action pode ser chamada: telas e componentes. */
const CALLER_DIRS = ["src/app", "src/components"];

function walk(dir: string): string[] {
  const full = path.join(ROOT, dir);
  return readdirSync(full).flatMap((entry) => {
    const child = path.join(full, entry);
    return statSync(child).isDirectory()
      ? walk(path.relative(ROOT, child))
      : [child];
  });
}

function exportedActions(modulePath: string): string[] {
  const source = readFileSync(path.join(ROOT, modulePath), "utf8");
  return [...source.matchAll(/^export async function (\w+Action)\b/gm)].map((match) => match[1]!);
}

const callerSources = CALLER_DIRS.flatMap(walk)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

describe("toda action tem quem a chame", () => {
  const todas = ACTION_MODULES.flatMap((module) =>
    exportedActions(module).map((action) => ({ module, action })),
  );

  it("existem actions para verificar", () => {
    expect(todas.length).toBeGreaterThan(15);
  });

  it.each(todas)("$action é chamada por alguma superfície", ({ action }) => {
    expect(
      callerSources.includes(action),
      `${action} não tem chamador em src/app nem src/components. Ou a tela ficou faltando, ou a action é capacidade duplicada e deve sair.`,
    ).toBe(true);
  });
});

/**
 * TRACK D · A CORREÇÃO — "tem chamador" não é "a paciente alcança".
 *
 * O bloco abaixo afirmava que a Curadoria é executável de ponta a ponta, e
 * media isso concatenando `src/app` + `src/components` INTEIROS numa string.
 * Um arquivo órfão contém as chamadas — então **ele satisfazia a própria
 * verificação**. Era a mesma classe de falso positivo que deixou
 * `CuradoriaDecisionPanel` fora da rota com a suíte verde.
 *
 * Duas actions passavam por aqui sem ninguém alcançá-las:
 * `addMandatoryFilterAction` e `addPreferenceAction`, chamadas só por
 * `mandatory-filters.tsx`, que nenhuma rota renderiza. **A fase Filtros do COS
 * é inexecutável hoje** — e o teste dizia o contrário.
 *
 * A régua passou a ser o grafo de imports a partir de `src/app`. E o que era
 * mentira virou fato nomeado: as duas ficam numa lista própria, `ENTERRADAS`,
 * afirmada nos DOIS sentidos — o arquivo existe (não pode ser apagado) e as
 * actions continuam inalcançáveis (o gap continua aberto). No dia em que a
 * Mesa der superfície ao componente, este teste falha e obriga a promoção.
 */
const alcancavelDeApp = (() => {
  const vistos = new Set<string>();
  const fila = walk("src/app");

  while (fila.length) {
    const atual = fila.pop()!;
    if (vistos.has(atual) || !/\.tsx?$/.test(atual)) continue;
    vistos.add(atual);

    const codigo = readFileSync(atual, "utf8");
    for (const re of [/from\s+["']([^"']+)["']/g, /import\(\s*["']([^"']+)["']\s*\)/g]) {
      for (const m of codigo.matchAll(re)) {
        const destino = resolveEspecificador(m[1]!, atual);
        if (destino && !vistos.has(destino)) fila.push(destino);
      }
    }
  }
  return vistos;
})();

/**
 * A fonte que conta como SUPERFÍCIE: só telas e componentes que alguma rota
 * alcança. O módulo que declara as actions fica de fora de propósito — ele
 * contém os nomes por definição, e incluí-lo faria tudo passar.
 */
const superficiesAlcancaveis = [...alcancavelDeApp]
  .filter((f) => {
    const r = path.relative(ROOT, f).split(path.sep).join("/");
    return r.startsWith("src/app/") || r.startsWith("src/components/");
  })
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

function resolveEspecificador(especificador: string, deOnde: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = path.join(ROOT, "src", especificador.slice(2));
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

describe("a Curadoria é executável de ponta a ponta pela interface", () => {
  /**
   * As actions que fecham o fluxo completo, e que ALGUMA ROTA alcança. Cada
   * uma esteve órfã, e cada uma corresponde a um passo que o Curador (ou o
   * paciente) não conseguia dar sem SQL.
   */
  const FLUXO_COMPLETO = [
    "registerAcolhimentoAction",
    "registerHistoriaAction",
    "registerCasoAction",
    "startConsultationAction",
    // M5 (ADR-042): `computeCompatibilityAction` saiu do fluxo — a leitura de
    // compatibilidade vem do Motor, sem ato de "comparar com a rede".
    "saveSelectionAction",
    "saveReportAction",
    "emitReportAction",
    "deliverSelectionAction",
    "registerDevolutivaAction",
    "registerDecisionAction",
  ];

  /** GAP-D-1 · a fase Filtros existe em código e não existe em jornada. */
  const ENTERRADAS = ["addMandatoryFilterAction", "addPreferenceAction"];
  const PORTA_ENTERRADA = "src/components/curadoria/mandatory-filters.tsx";

  it.each(FLUXO_COMPLETO)("%s é alcançada por alguma rota", (action) => {
    expect(
      superficiesAlcancaveis.includes(action),
      `${action} não é alcançada por nenhuma rota. Conter a chamada num arquivo ` +
        `órfão não conta — foi exatamente assim que a fase Filtros ficou invisível.`,
    ).toBe(true);
  });

  it.each(ENTERRADAS)("%s continua ENTERRADA — e isso é o GAP-D-1, não um acaso", (action) => {
    // Sentido 1 · a porta existe e não pode ser apagada: apagá-la deixaria a
    // action sem nenhum chamador, e a fase Filtros sem sequer código.
    const porta = readFileSync(path.join(ROOT, PORTA_ENTERRADA), "utf8");
    expect(porta, `${action} perdeu seu único chamador`).toContain(action);

    // Sentido 2 · e continua inalcançável. No dia em que a Mesa a renderizar,
    // este teste falha — e o correto é mover a action para FLUXO_COMPLETO.
    expect(
      superficiesAlcancaveis.includes(action),
      `${action} passou a ser alcançável: o GAP-D-1 fechou. Mova-a para FLUXO_COMPLETO.`,
    ).toBe(false);
  });

  it("nenhuma capacidade duplicada voltou a existir", () => {
    const curadoria = readFileSync(
      path.join(ROOT, "src/modules/curadoria/actions.ts"),
      "utf8",
    );
    // Removidas por duplicarem `saveAllWeightsAction` e `registerHistoriaAction`.
    expect(curadoria).not.toMatch(/^export async function saveWeightAction\b/m);
    expect(curadoria).not.toMatch(/^export async function savePatientHistoryAction\b/m);
  });
});
