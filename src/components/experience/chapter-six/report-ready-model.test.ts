import { describe, expect, it } from "vitest";

import { CURATION_HOST } from "../chapter-four/curation-model";
import {
  buildReportReadyClosingNote,
  buildReportReadyLines,
} from "./report-ready-model";

describe("report-ready-model", () => {
  it("prepara emocionalmente sem expor o conteúdo do relatório", () => {
    const lines = buildReportReadyLines();
    const text = lines.map((line) => line.text).join(" ").toLowerCase();

    expect(lines.some((line) => line.text.includes("relatório está pronto"))).toBe(true);
    expect(text).toMatch(/estudamos|comparamos|justificativa/);
    expect(text).not.toMatch(/dra\.|dr\.|médic/);
    expect(text).not.toContain("pdf");
    expect(text).not.toContain("download");
  });

  it("comunica trabalho humano, não entrega de arquivo", () => {
    const text = buildReportReadyLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toMatch(/trabalho feito|seriedade|especialmente para você/);
    expect(text).toContain("não se trata de receber um arquivo");
    expect(text).not.toMatch(/algoritmo|inteligência artificial|ranking|score/);
  });

  it("mantém o paciente como protagonista e o gestor presente", () => {
    const lines = buildReportReadyLines();

    expect(lines.some((line) => line.text.includes(CURATION_HOST))).toBe(true);
    expect(lines.some((line) => line.text.includes("protagonista"))).toBe(true);
  });

  it("termina antes da abertura do relatório", () => {
    const closing = buildReportReadyClosingNote().toLowerCase();
    const text = buildReportReadyLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(closing).toContain("quando estiver pronto");
    expect(text).not.toMatch(/baixar|anex|tabela/);
  });
});
