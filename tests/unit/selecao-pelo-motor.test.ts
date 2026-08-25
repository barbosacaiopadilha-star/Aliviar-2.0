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

const PAGE = "src/app/portal-curador/casos/[id]/mesa/page.tsx";
const COMPOR = "src/components/curadoria/mesa-preocupacoes/compor-os-tres.tsx";
const SELECAO = "src/modules/curadoria/composicao-dos-tres.ts";

describe("A etapa CAMINHOS não depende do pipeline legado", () => {
  const page = ler(PAGE);

  it("a página da Mesa não monta o runner nem o gate de recálculo", () => {
    expect(page).not.toContain("CompatibilityRunner");
    expect(page).not.toContain("computedAt");
  });

  it("a página não consulta as análises legadas para montar ou salvar a seleção (M2)", () => {
    expect(page).not.toContain("legacyBands");
    expect(page).not.toContain("record.curadoriaTecnica.analyses");
  });

  // A Mesa nova (ADR-093) não tem `candidatosDaSelecao`: ela filtra os
  // elegíveis da leitura canônica da Rede e passa esses — e só esses — para
  // compor. Quem não passou pela porta não some: aparece no painel de
  // elegibilidade, com o estado e o ato que falta.
  it("a página monta a seleção a partir dos elegíveis da Rede canônica", () => {
    expect(page).toContain("loadMesaCruzamento");
    expect(page).toContain('eligibility.state === "ELEGIVEL"');
  });
});

describe("Compor os três consome o Motor, não o motor antigo", () => {
  const workspace = ler(COMPOR);

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

  // A matriz premium saiu com a Mesa antiga (ADR-093). Na Mesa nova o
  // candidato aparece resumido pelas FRASES DELA — contagens, nunca notas.
  it("a comparação da seleção sai do resumo pelas preocupações dela", () => {
    expect(workspace).toContain("resumirCandidatos");
  });

  it("não ordena candidato por chave nenhuma", () => {
    expect(workspace.includes(".sort(")).toBe(false);
  });

  it("a banda saiu do contrato operacional (M2) — nenhum vestígio na tela da escolha", () => {
    for (const proibido of ["legacyBands", "bandaDeCompatibilidade", "MODERADA", "CompatibilityBand", "bandFor"]) {
      expect(workspace.includes(proibido), proibido).toBe(false);
    }
  });

  /**
   * O QUE A COMPOSIÇÃO PRECISA CONTINUAR TENDO.
   *
   * A lista anterior era do vocabulário da máquina de estados da Mesa antiga
   * (`SET_COMPOSITION`, `MOVE_SELECTION`, `REOPEN`, `validateMesaClosure`).
   * Ela saiu com a Mesa (ADR-093), e o que sobrevive é o CONTRATO do Método,
   * que nunca dependeu daquela máquina: exatamente três, cada um com razão
   * escrita, mais a razão da COMPOSIÇÃO — por que estes três, juntos, para
   * esta pessoa.
   *
   * `REOPEN` NÃO foi substituído, e isso está registrado como `SIM-49` em vez
   * de sumir aqui: a Mesa nova não mostra a composição já feita ao reabrir o
   * painel. A gravação é upsert, então recompor funciona — o que falta é a
   * tela dizer o que já foi decidido.
   */
  it("o contrato da composição permanece: três, com razão de cada um e do conjunto", () => {
    for (const preservado of [
      "saveSelectionAction",
      "compositionRationale",
      "razoesSugeridas",
      "tradeOff",
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
