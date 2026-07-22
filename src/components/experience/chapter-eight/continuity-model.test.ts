import { describe, expect, it } from "vitest";

import { CURATION_HOST } from "../chapter-four/curation-model";
import { buildContinuityLines, buildContinuityRestNote } from "./continuity-model";

describe("continuity-model", () => {
  it("comunica continuidade após o relatório, não encerramento", () => {
    const lines = buildContinuityLines();
    const text = lines.map((line) => line.text).join(" ").toLowerCase();

    expect(text).toMatch(/nova fase|continua acompanhado|não termina|inaugura/);
    expect(text).not.toMatch(/fim da jornada|encerramos|até nunca mais/);
  });

  it("reforça autonomia, disponibilidade e apoio na decisão", () => {
    const text = buildContinuityLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toMatch(/decisão.*sua|escolha continua sendo sua/);
    expect(text).toMatch(/conversar|coordenação|dúvida/);
    expect(text).toContain(CURATION_HOST.toLowerCase());
  });

  it("encerra com gratidão humana, sem marketing", () => {
    const text = buildContinuityLines()
      .map((line) => line.text)
      .join(" ")
      .toLowerCase();

    expect(text).toContain("obrigado por confiar sua história a nós");
    expect(text).not.toMatch(/compre|assine|promoção|oferta|desconto/);
    expect(buildContinuityRestNote().toLowerCase()).not.toContain("compre");
  });

  it("não propõe suporte operacional", () => {
    const text = [
      ...buildContinuityLines().map((line) => line.text),
      buildContinuityRestNote(),
    ]
      .join(" ")
      .toLowerCase();

    expect(text).not.toMatch(/ticket|faq|chat|dashboard|crm|central de suporte/);
  });
});
