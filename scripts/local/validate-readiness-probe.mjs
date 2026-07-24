/**
 * Valida readiness localmente (carrega .env.local, não imprime segredos).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(join(ROOT, ".env.local"));
loadEnv(join(ROOT, "scripts", "local", ".env.admin.local"));

const { runOperationalHealthChecks } = await import(
  "../../src/infrastructure/observability/health-check.ts"
);

const report = await runOperationalHealthChecks();
const ready = report.status !== "down";

console.log("READINESS_PROBE");
console.log(`STATUS:${report.status}`);
console.log(`READY:${ready ? "SIM" : "NAO"}`);
console.log(`SUMMARY:ok=${report.summary.ok} degraded=${report.summary.degraded} down=${report.summary.down}`);

for (const check of report.checks.filter((c) => c.status !== "ok")) {
  console.log(`CHECK:${check.name}:${check.status}:${check.detail}`);
}

process.exit(ready ? 0 : 1);
