import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, beforeEach } from "vitest";

import { formatEvidenceCoverageReportMarkdown } from "../evidence-coverage-engine";
import { getEvidenceCoverageSnapshot, resetEvidenceCoverageSession } from "../studio-adapter";

describe("evidence-coverage studio adapter", () => {
  beforeEach(() => {
    resetEvidenceCoverageSession();
  });

  it("cobre snapshot com refresh", async () => {
    const snapshot = await getEvidenceCoverageSnapshot({ refresh: true });

    expect(snapshot.analyses.length).toBeGreaterThan(0);
    expect(snapshot.kpis.averageCoverage).toBeGreaterThanOrEqual(0);
    expect(snapshot.acquisitionPlan.entries.length).toBeGreaterThan(0);
  }, 30_000);

  it("reutiliza snapshot em cache", async () => {
    await getEvidenceCoverageSnapshot({ refresh: true });
    const cached = await getEvidenceCoverageSnapshot({ refresh: false });
    expect(cached.generatedAt).toBeTruthy();
  }, 30_000);

  it("grava relatório operacional com dados do piloto ES", async () => {
    const snapshot = await getEvidenceCoverageSnapshot({ refresh: true });
    const markdown = formatEvidenceCoverageReportMarkdown(snapshot);
    const outputPath = path.resolve(process.cwd(), "docs/alicia/EVIDENCE_COVERAGE_REPORT.md");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${markdown}\n`, "utf8");

    expect(snapshot.analyses.length).toBeGreaterThanOrEqual(6);
    expect(markdown).toContain("Cobertura média");
    expect(fs.existsSync(outputPath)).toBe(true);
  }, 30_000);
});
