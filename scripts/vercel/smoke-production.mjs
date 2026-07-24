/**
 * Smoke HTTP de produção — rotas AliCIA e Studio bloqueado.
 * Uso: node scripts/vercel/smoke-production.mjs [BASE_URL]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  await readFile(join(__dirname, "..", "release", "release-config.json"), "utf8"),
);

const BASE = (process.env.PRODUCTION_URL ?? process.argv[2] ?? config.productionUrl).replace(/\/$/, "");
const results = [];
const startedAt = new Date().toISOString();

async function fetchMeta(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const text = await res.text().catch(() => "");
  return {
    status: res.status,
    location: res.headers.get("location") ?? "",
    server: res.headers.get("server") ?? "",
    poweredBy: res.headers.get("x-powered-by") ?? "",
    vercelId: res.headers.get("x-vercel-id") ?? "",
    text: text.slice(0, 500),
  };
}

async function check(label, path, expectStatus) {
  try {
    const meta = await fetchMeta(path);
    const ok = expectStatus.includes(meta.status);
    results.push({ label, path, ok, ...meta });
    console.log(`${ok ? "PASS" : "FAIL"}:${label}:${meta.status}`);
    return ok;
  } catch (error) {
    results.push({ label, path, ok: false, error: error.message });
    console.log(`FAIL:${label}:${error.message}`);
    return false;
  }
}

console.log(`SMOKE_PRODUCTION_BASE:${BASE}`);

for (const route of config.smokeRoutes.public) {
  const label = route.path.replace(/^\//, "").replace(/\//g, "_") || "root";
  await check(label, route.path, route.expectStatus);
}

for (const route of config.smokeRoutes.studioBlocked) {
  const label = `studio_blocked_${route.path.split("/").pop()}`;
  await check(label, route.path, route.expectStatus);
}

const aliciaHome = await fetchMeta("/alicia");
const hasAliciaContent = aliciaHome.status === 200;
results.push({ label: "metadata_alicia", ok: hasAliciaContent, status: aliciaHome.status });
console.log(`${hasAliciaContent ? "PASS" : "FAIL"}:metadata_alicia`);

const failed = results.filter((r) => r.ok === false);
const report = {
  tipo: "smoke_production",
  base: BASE,
  gerado_em: startedAt,
  passed: results.length - failed.length,
  failed: failed.length,
  verde: failed.length === 0,
  results,
};

const reportDir = join(__dirname, "..", "release", "reports");
await mkdir(reportDir, { recursive: true });
const stamp = startedAt.replace(/[:.]/g, "-");
const reportPath = join(reportDir, `smoke-production-${stamp}.json`);
await writeFile(reportPath, JSON.stringify(report, null, 2));

console.log("---");
console.log(`PASSED:${report.passed}`);
console.log(`FAILED:${report.failed}`);
console.log(`VERDE:${report.verde ? "SIM" : "NAO"}`);
console.log(`REPORT:${reportPath}`);
process.exit(failed.length ? 1 : 0);
