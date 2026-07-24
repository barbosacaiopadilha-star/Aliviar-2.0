/**
 * Smoke HTTP para deploy preview Vercel.
 */
const BASE = (process.env.VALIDATION_BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");
if (!BASE) {
  console.error("USAGE: VALIDATION_BASE_URL=https://... node scripts/local/smoke-preview-deploy.mjs");
  process.exit(1);
}

const results = [];

async function check(label, path, expect) {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const text = await res.text().catch(() => "");
    const location = res.headers.get("location") ?? "";
    const ok = expect({ status: res.status, location, text });
    results.push({ label, ok, status: res.status, location: location.slice(0, 120) });
    console.log(`${ok ? "PASS" : "FAIL"}:${label}:${res.status}${location ? ` → ${location}` : ""}`);
    return ok;
  } catch (error) {
    results.push({ label, ok: false, error: error.message });
    console.log(`FAIL:${label}:${error.message}`);
    return false;
  }
}

console.log(`SMOKE_PREVIEW_BASE:${BASE}`);

await check("landing", "/", (r) => r.status === 200);
await check("portal", "/portal", (r) => [200, 307, 308].includes(r.status));
await check("portal_entrar", "/portal/entrar", (r) => [200, 307, 308].includes(r.status));
await check(
  "curador_protegido",
  "/curador",
  (r) =>
    r.status === 200 ||
    ([302, 307, 308].includes(r.status) && r.location.includes("/login")),
);
await check(
  "admin_protegido",
  "/admin",
  (r) =>
    r.status === 200 ||
    ([302, 307, 308].includes(r.status) && r.location.includes("/login")),
);
await check(
  "workspace_protegido",
  "/workspace",
  (r) =>
    r.status === 200 ||
    ([302, 307, 308].includes(r.status) && r.location.includes("/login")),
);
await check("login", "/login", (r) => r.status === 200 || r.status === 307);
await check("workflow_api_metricas", "/api/v1/operacao/metricas", (r) =>
  [200, 401, 403, 400].includes(r.status),
);
await check("workflow_api_casos", "/api/v1/casos", (r) =>
  [401, 403, 400, 405].includes(r.status),
);
await check("ace_health_table", "/api/v1/health", (r) => {
  if (![200, 207].includes(r.status)) return false;
  try {
    const json = JSON.parse(r.text);
    const checks = json?.data?.checks ?? json?.checks ?? [];
    return checks.some((c) => String(c.name ?? "").includes("ace") || String(c.detail ?? "").includes("ace"));
  } catch {
    return r.text.toLowerCase().includes("ace") || r.status === 207;
  }
});
await check("health", "/api/v1/health", (r) => [200, 207].includes(r.status));
await check("api_curador_fila", "/api/v1/curador/fila", (r) => [401, 403, 400].includes(r.status));
await check("api_me_jornada", "/api/v1/me/jornada", (r) => [401, 403].includes(r.status));
await check("api_admin_saude", "/api/v1/admin/saude", (r) => [401, 403, 400].includes(r.status));

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(`PASSED:${results.length - failed.length}`);
console.log(`FAILED:${failed.length}`);
console.log(`VERDE:${failed.length === 0 ? "SIM" : "NAO"}`);
process.exit(failed.length ? 1 : 0);
