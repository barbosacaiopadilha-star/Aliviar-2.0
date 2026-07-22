import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORT = join(ROOT, "scripts/local/validation-report.json");

describe("E2E real (gate)", () => {
  const enabled = process.env.VALIDATION_E2E_REAL === "1";

  it.skipIf(!enabled)("executa validate-e2e-real.mjs com persistencia", () => {
    execSync("node scripts/local/validate-e2e-real.mjs", {
      cwd: ROOT,
      stdio: "pipe",
      env: { ...process.env, VALIDATION_E2E_REAL: "1" },
    });
    expect(existsSync(REPORT)).toBe(true);
    const report = JSON.parse(readFileSync(REPORT, "utf8"));
    expect(report.sucesso).toBe(true);
  }, 300_000);
});
