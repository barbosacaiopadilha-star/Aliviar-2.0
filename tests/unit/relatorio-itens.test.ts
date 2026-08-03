/**
 * FRENTE D3 — a transformação itens ↔ textarea tem inversa definida.
 */
import { describe, expect, it } from "vitest";

import { itensParaTextarea, textareaParaItens } from "@/modules/curadoria/relatorio-itens";

describe("relatorio-itens — um item por linha, com inversa definida", () => {
  it("round-trip: itens sem quebra interna voltam idênticos", () => {
    const itens = ["Agenda bastante concorrida — o início pode demorar.", "Não atende online."];
    expect(textareaParaItens(itensParaTextarea(itens))).toEqual(itens);
  });

  it("a ordem dos itens é preservada", () => {
    const itens = ["c", "a", "b"];
    expect(textareaParaItens(itensParaTextarea(itens))).toEqual(["c", "a", "b"]);
  });

  it("espaços e pontuação dentro da linha nunca separam itens", () => {
    expect(textareaParaItens("Agenda cheia, com espera. Retorno só em março.")).toEqual([
      "Agenda cheia, com espera. Retorno só em março.",
    ]);
    expect(textareaParaItens("dois  espaços  internos")).toEqual(["dois  espaços  internos"]);
  });

  it("linhas vazias e aparas de borda saem; nada vira item vazio", () => {
    expect(textareaParaItens("  primeiro  \n\n\n segundo \n")).toEqual(["primeiro", "segundo"]);
    expect(textareaParaItens("")).toEqual([]);
    expect(textareaParaItens("   \n   ")).toEqual([]);
  });

  it("CRLF conta como uma quebra só", () => {
    expect(textareaParaItens("um\r\ndois")).toEqual(["um", "dois"]);
  });

  it("item legado com quebra interna: a re-tokenização é a regra definida (uma linha = um item)", () => {
    // A preservação byte a byte do campo INTOCADO é responsabilidade do
    // chamador (ReportEditor reenvia o array carregado); quando o texto passa
    // pela inversa, cada linha visível é um item — nunca fusão.
    expect(textareaParaItens(itensParaTextarea(["a\nb", "c"]))).toEqual(["a", "b", "c"]);
  });
});
