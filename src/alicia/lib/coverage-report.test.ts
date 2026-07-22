import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import catalogSeed from "@/alicia/infrastructure/seed/catalog.seed.json";
import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";

import { buildCoverageReport, formatCoverageReportMarkdown } from "./coverage-report";

describe("coverage report", () => {
  it("builds ES coverage metrics from the live seed", () => {
    const report = buildCoverageReport(catalogSeed as CatalogImportPayload);

    expect(report.totalDoctors).toBeGreaterThan(0);
    expect(report.specialties.Ortopedia).toBeGreaterThan(0);
    expect(report.specialties.Neurocirurgia).toBeGreaterThan(0);
    expect(report.doctors.every((doctor) => doctor.sources.length > 0)).toBe(true);
  });

  it("writes the coverage report artifact", () => {
    const report = buildCoverageReport(catalogSeed as CatalogImportPayload);
    const markdown = formatCoverageReportMarkdown(report);
    const outputPath = path.resolve(process.cwd(), "docs/alicia/ES_COVERAGE_REPORT.md");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${markdown}\n`, "utf8");

    expect(fs.existsSync(outputPath)).toBe(true);
    expect(markdown).toContain("Relatório de Cobertura Espírito Santo");
  });
});
