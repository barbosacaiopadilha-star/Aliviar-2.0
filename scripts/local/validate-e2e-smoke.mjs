/**
 * Smoke HTTP — ambiente fechado de validação.
 * Valida rotas, proteção de API e health sem mocks.
 */
import { existsSync, readFileSync } from "node:fs";
import { loadValidationEnv, writeReport } from "./validation-lib.mjs";

const results = { passed: [], failed: [], problemas: [] };

function pass(label) {
  results.passed.push(label);
  console.log(`PASS:${label}`);
}

function fail(label, detail = "") {
  results.failed.push(`${label}${detail ? `:${detail}` : ""}`);
  console.log(`FAIL:${label}${detail ? `:${detail}` : ""}`);
}

function prob(classe, mensagem) {
  results.problemas.push({ classe, mensagem });
}

async function fetchPath(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...options });
  const text = await res.text();
  return { res, text, location: res.headers.get("location") ?? "" };
}

async function main() {
  const env = loadValidationEnv();
  const BASE = env.VALIDATION_BASE_URL.replace(/\/$/, "");

  console.log(`SMOKE_HTTP_BASE:${BASE}`);
  console.log("AMBIENTE:fechado");

  const checks = [
    { path: "/", label: "landing", expect: (r) => r.res.status === 200 },
    { path: "/portal", label: "portal", expect: (r) => [200, 307, 308].includes(r.res.status) },
    { path: "/login", label: "health_login", expect: (r) => r.res.ok || r.res.status === 307 },
    {
      path: "/curador",
      label: "curador_protegido",
      expect: (r) =>
        ([302, 307, 308].includes(r.res.status) && r.location.includes("/login")) || r.res.status === 200,
    },
    {
      path: "/api/v1/curador/fila",
      label: "api_curador_fila",
      expect: (r) => [401, 403].includes(r.res.status),
    },
    {
      path: "/api/v1/me/jornada",
      label: "api_me_jornada",
      expect: (r) => [401, 403].includes(r.res.status),
    },
    {
      path: "/api/v1/me/documentos",
      label: "api_me_documentos",
      expect: (r) => [401, 403, 405].includes(r.res.status),
    },
  ];

  let serverUp = false;
  try {
    const health = await fetchPath(BASE, "/login");
    serverUp = health.res.ok || health.res.status === 307;
  } catch {
    serverUp = false;
  }

  if (!serverUp) {
    fail("dev_server");
    prob("AMBIENTE", "Dev server inacessivel");
    printSummary();
    writeReport({ tipo: "smoke_http", ...results, gerado_em: new Date().toISOString() });
    process.exit(1);
  }
  pass("dev_server");

  for (const check of checks) {
    try {
      const response = await fetchPath(BASE, check.path);
      if (check.expect(response)) pass(check.label);
      else fail(check.label, `status_${response.res.status}`);
    } catch (error) {
      fail(check.label, error.message);
    }
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    fail("env_service_role");
    prob("CONFIGURACAO", "SUPABASE_SERVICE_ROLE_KEY ausente");
  } else pass("env_service_role");

  if (!env.ADMIN_NEW_PASSWORD) {
    fail("env_admin_password");
    prob("CONFIGURACAO", "ADMIN_NEW_PASSWORD ausente");
  } else pass("env_admin_password");

  const reportPath = "scripts/local/validation-report.json";
  if (existsSync(reportPath)) {
    const diag = JSON.parse(readFileSync(reportPath, "utf8"));
    if (diag.schema?.ready) pass("schema_report_ready");
    else {
      fail("schema_report_ready");
      prob("INFRAESTRUTURA", "Schema Aliviar OS incompleto no relatorio de diagnostico");
    }
  } else {
    fail("diagnose_report");
    prob("AMBIENTE", "Execute npm run validation:diagnose antes do smoke HTTP");
  }

  printSummary();
  writeReport({
    tipo: "smoke_http",
    gerado_em: new Date().toISOString(),
    base: BASE,
    ...results,
  });
  process.exit(results.failed.length ? 1 : 0);
}

function printSummary() {
  console.log("---");
  console.log(`PASSED:${results.passed.length}`);
  console.log(`FAILED:${results.failed.length}`);
  console.log(`PROBLEMAS:${results.problemas.length}`);
}

main().catch((error) => {
  fail("unexpected", error.message);
  printSummary();
  process.exit(1);
});
