import { describe, expect, it } from "vitest";

import {
  EXEMPLAR_CURATION_REPORT,
  getExemplarCurationReport,
  professionalSectionLabel,
  PROFESSIONAL_SECTION_LABELS,
} from "./curation-report-model";

describe("curation-report-model", () => {
  it("estrutura o relatório com contexto, critérios e até três profissionais", () => {
    const report = getExemplarCurationReport();

    expect(report.patientContext.length).toBeGreaterThan(0);
    expect(report.criteria.length).toBeGreaterThan(0);
    expect(report.professionals.length).toBeLessThanOrEqual(3);
    expect(report.professionals.length).toBeGreaterThan(0);
    expect(report.closingParagraphs.length).toBeGreaterThan(0);
  });

  it("cada profissional traz justificativa completa", () => {
    for (const professional of EXEMPLAR_CURATION_REPORT.professionals) {
      expect(professional.whyInReport.length).toBeGreaterThan(20);
      expect(professional.formationAndTrajectory.length).toBeGreaterThan(20);
      expect(professional.whenGoodChoice.length).toBeGreaterThan(20);
      expect(professional.name).toMatch(/^(Dr\.|Dra\.)/);
    }
  });

  it("usa rótulos editoriais, não ranking competitivo", () => {
    const labels = PROFESSIONAL_SECTION_LABELS.join(" ").toLowerCase();
    const fullText = JSON.stringify(EXEMPLAR_CURATION_REPORT).toLowerCase();

    expect(labels).not.toMatch(/#1|primeiro lugar|melhor/);
    expect(fullText).not.toMatch(/ranking|score|estrela|medalha|pódio|nota /);
    expect(professionalSectionLabel(0)).toBe("Uma referência para sua jornada");
    expect(professionalSectionLabel(1)).toBe("Outra perspectiva compatível com seu caso");
  });

  it("reforça que a decisão é do paciente", () => {
    const closing = EXEMPLAR_CURATION_REPORT.closingParagraphs.join(" ").toLowerCase();

    expect(closing).toMatch(/decisão.*sua|continua sendo sua/);
    expect(closing).toContain("equipe aliviar");
  });
});
