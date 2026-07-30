import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * M1 — GUARDA DA VIRADA DA SELEÇÃO (executa a ADR-042 na etapa CAMINHOS).
 *
 * Guardas de texto de propósito, no mesmo espírito de `mesa-sem-pesos`: o que
 * precisa ser garantido não é o retorno de uma função, é que a tela da escolha
 * não volte a nascer do pipeline legado.
 */

/** Comentário que EXPLICA a virada cita o vocabulário antigo de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .split("\n")
    .filter((linha) => {
      const limpa = linha.trimStart();
      return (
        !limpa.startsWith("//") &&
        !limpa.startsWith("*") &&
        !limpa.startsWith("/*") &&
        !limpa.startsWith("{/*")
      );
    })
    .join("\n");
}

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

const PAGE = "src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx";
const WORKSPACE = "src/components/curadoria/mesa-workspace.tsx";
const SELECAO = "src/modules/curadoria/mesa-selecao.ts";

describe("A etapa CAMINHOS não depende do pipeline legado", () => {
  const page = ler(PAGE);

  it("a página da Mesa não monta o runner nem o gate de recálculo", () => {
    expect(page).not.toContain("CompatibilityRunner");
    expect(page).not.toContain("computedAt");
  });

  it("a página monta a seleção a partir dos elegíveis da Mesa e da leitura do Motor", () => {
    expect(page).toContain("candidatosDaSelecao(view.comparison");
    expect(page).toContain("foraDaSelecao(view.professionals)");
  });

  it("Case sem candidatos abre com explicação, nunca com tela quebrada", () => {
    expect(page).toContain("A seleção ainda não tem candidatos.");
  });
});

describe("MesaWorkspace consome o Motor, não o motor antigo", () => {
  const workspace = ler(WORKSPACE);

  it("nenhum vestígio operacional do pipeline legado", () => {
    for (const proibido of [
      "AnaliseRecord",
      "ExclusaoRecord",
      "MesaComparison",
      "MesaDoctorCard",
      "internalScore",
      "organizeForCurator",
      "compatibility_analyses",
      "runCompatibility",
      "COMPATIBILITY_BAND_LABELS",
    ]) {
      expect(workspace.includes(proibido), proibido).toBe(false);
    }
  });

  it("a comparação da seleção é a mesma matriz do Motor (ComparacaoPremium)", () => {
    expect(workspace).toContain("ComparacaoPremium");
  });

  it("não ordena candidato por chave nenhuma", () => {
    expect(workspace.includes(".sort(")).toBe(false);
  });

  it("a banda só sobrevive como compatibilidade de contrato (M2), nunca calculada", () => {
    expect(workspace).toContain("bandaDeCompatibilidade");
    expect(workspace).not.toContain("bandFor");
  });

  it("pareceres, composição, encerramento e reabertura permanecem", () => {
    for (const preservado of [
      "PARECER_PROMPTS",
      "validateMesaClosure",
      "SET_COMPOSITION",
      "MOVE_SELECTION",
      "REOPEN",
      "saveSelectionAction",
      "saveReportAction",
      "Reabrir para corrigir",
    ]) {
      expect(workspace.includes(preservado), preservado).toBe(true);
    }
  });
});

describe("O módulo da seleção é puro e não conhece o legado", () => {
  const selecao = ler(SELECAO);

  it("não importa nem referencia o pipeline antigo", () => {
    for (const proibido of [
      "runCompatibility",
      "compatibility_analyses",
      "priority_weights",
      "internalScore",
      "organizeForCurator",
      "supabase",
    ]) {
      expect(selecao.includes(proibido), proibido).toBe(false);
    }
  });

  it("não ordena", () => {
    expect(selecao.includes(".sort(")).toBe(false);
  });
});
