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

describe("a Curadoria é executável de ponta a ponta pela interface", () => {
  /**
   * As actions que fecham o fluxo completo. Cada uma esteve órfã, e cada uma
   * corresponde a um passo que o Curador (ou o paciente) não conseguia dar
   * sem SQL.
   */
  const FLUXO_COMPLETO = [
    "registerAcolhimentoAction",
    "registerHistoriaAction",
    "registerCasoAction",
    "startConsultationAction",
    "addMandatoryFilterAction",
    "addPreferenceAction",
    "computeCompatibilityAction",
    "saveSelectionAction",
    "saveReportAction",
    "emitReportAction",
    "deliverSelectionAction",
    "registerDevolutivaAction",
    "registerDecisionAction",
  ];

  it.each(FLUXO_COMPLETO)("%s tem superfície", (action) => {
    expect(callerSources.includes(action), `${action} não tem superfície`).toBe(true);
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
