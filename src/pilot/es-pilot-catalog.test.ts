import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runEsPilotCatalog } from "./es-pilot-catalog";
import {
  formatCatalogQualityReport,
  formatPilotEsReport,
  formatReviewCaseAnalysis,
} from "./format-pilot-reports";

const DOCS_DIR = path.resolve(process.cwd(), "docs/alicia");

describe("ES pilot catalog — Mission 006", () => {
  it("executa pipeline piloto ES e gera relatórios", async () => {
    const report = await runEsPilotCatalog();

    expect(report.scope.state).toBe("ES");
    expect(report.scope.specialties).toContain("Ortopedia");
    expect(report.scope.specialties).toContain("Neurocirurgia");
    expect(report.discovery.uniqueCandidates).toBeGreaterThan(0);
    expect(report.curatedCatalog.totalDoctors).toBeGreaterThan(0);

    fs.mkdirSync(DOCS_DIR, { recursive: true });

    const pilotReport = formatPilotEsReport(report);
    const qualityReport = formatCatalogQualityReport(report);
    const reviewAnalysis = formatReviewCaseAnalysis(report);

    fs.writeFileSync(path.join(DOCS_DIR, "PILOT_ES_REPORT.md"), `${pilotReport}\n`, "utf8");
    fs.writeFileSync(
      path.join(DOCS_DIR, "CATALOG_QUALITY_REPORT.md"),
      `${qualityReport}\n`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(DOCS_DIR, "REVIEW_CASE_ANALYSIS.md"),
      `${reviewAnalysis}\n`,
      "utf8",
    );

    expect(fs.existsSync(path.join(DOCS_DIR, "PILOT_ES_REPORT.md"))).toBe(true);
    expect(fs.existsSync(path.join(DOCS_DIR, "CATALOG_QUALITY_REPORT.md"))).toBe(true);
    expect(fs.existsSync(path.join(DOCS_DIR, "REVIEW_CASE_ANALYSIS.md"))).toBe(true);

    expect(pilotReport).toContain("Piloto ES");
    expect(qualityReport).toContain("Qualidade do Catálogo");
    expect(reviewAnalysis).toContain("Review Cases");
  }, 60_000);
});
