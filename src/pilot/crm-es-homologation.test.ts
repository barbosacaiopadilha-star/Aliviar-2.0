import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { formatCrmHomologationMarkdown } from "@/alicia/connectors/adapters/crm-estadual/homologation";

import { runCrmEsHomologation } from "./crm-es-homologation";

const DOCS_DIR = path.resolve(process.cwd(), "docs/alicia");
const REPORT_PATH = path.join(DOCS_DIR, "CRM_ES_HOMOLOGATION_REPORT.md");

describe("CRM ES homologation — Mission 010", () => {
  it("executa homologação CRM ES e gera relatório", async () => {
    const report = await runCrmEsHomologation();

    expect(report.mission).toBe("010");
    expect(report.config.checks.length).toBe(3);
    expect(report.discovery.mock.unique).toBeGreaterThanOrEqual(0);
    expect(["READY_FOR_PRODUCTION", "NEEDS_IMPROVEMENT"]).toContain(report.classification);

    const markdown = formatCrmHomologationMarkdown(report);
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${markdown}\n`, "utf8");

    expect(markdown).toContain("CRM Estadual ES");
    expect(markdown).toContain(report.classification);
    expect(fs.existsSync(REPORT_PATH)).toBe(true);
  }, 120_000);
});
