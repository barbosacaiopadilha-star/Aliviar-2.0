/**
 * Cutover Aliviar 2.0 — publicação oficial (sem alterar código do produto).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OFFICIAL = "https://www.aliviarcuradoriamedica.com.br";
const PROJECT = "aliviar-os";
const SUPABASE_REF = "awdlmeykminwyifnygkm";
const REPORT_PATH = join(ROOT, "scripts", "local", "cutover-report.json");

function loadEnv(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
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
    out[key] = value;
  }
  return out;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function saveReport(report) {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
}

const env = {
  ...loadEnv(join(ROOT, ".env.local")),
  ...loadEnv(join(ROOT, "scripts", "local", ".env.admin.local")),
};
env.NEXT_PUBLIC_SITE_URL = OFFICIAL;

const report = {
  gerado_em: new Date().toISOString(),
  official_url: OFFICIAL,
  fases: {},
};

// FASE 1 — Vercel Production env
const envKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_ALIVIAR_FILM_SRC",
];
for (const key of envKeys) {
  const value = env[key];
  if (!value) continue;
  const add = run(
    "npx",
    ["vercel", "env", "add", key, "production", "--yes", "--force", "--project", PROJECT],
    value,
  );
  report.fases[`vercel_env_${key}`] = { ok: add.ok, status: add.status };
}

// FASE 2 — Supabase Auth (Management API)
const redirectUrls = [
  `${OFFICIAL}/auth/callback`,
  `${OFFICIAL}/auth/confirm`,
  `${OFFICIAL}/portal/**`,
  `${OFFICIAL}/**`,
  "https://aliviar-os.vercel.app/auth/callback",
  "https://aliviar-os.vercel.app/auth/confirm",
  "https://aliviar-os.vercel.app/**",
];

const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? env.SUPABASE_ACCESS_TOKEN;
if (accessToken) {
  const authRes = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: OFFICIAL,
      uri_allow_list: redirectUrls.join(","),
    }),
  });
  const authBody = await authRes.text();
  report.fases.supabase_auth = {
    ok: authRes.ok,
    status: authRes.status,
    detail: authRes.ok ? "updated" : authBody.slice(0, 300),
  };
} else {
  report.fases.supabase_auth = {
    ok: false,
    skipped: true,
    detail: "SUPABASE_ACCESS_TOKEN ausente — atualizar manualmente no Dashboard",
    required: {
      site_url: OFFICIAL,
      redirect_urls: redirectUrls,
    },
  };
}

// FASE 3 — Domínio no projeto aliviar-os
const domainAdd = run("npx", [
  "vercel",
  "domains",
  "add",
  "www.aliviarcuradoriamedica.com.br",
  PROJECT,
  "--yes",
]);
report.fases.domain_add = {
  ok: domainAdd.ok,
  stdout: domainAdd.stdout.slice(-500),
  stderr: domainAdd.stderr.slice(-500),
};

// FASE 4 — Deploy production
const deployArgs = ["vercel", "deploy", "--prod", "--yes", "--no-color", "--project", PROJECT];
for (const key of envKeys) {
  if (env[key]) deployArgs.push("-e", `${key}=${env[key]}`);
}
const deploy = run("npx", deployArgs);
const deployUrl =
  [...`${deploy.stdout}\n${deploy.stderr}`.match(/https:\/\/[^\s]+\.vercel\.app/g) ?? []].at(-1) ??
  null;
report.fases.deploy = {
  ok: deploy.ok,
  url: deployUrl,
  production_alias: OFFICIAL,
  tail: `${deploy.stdout}\n${deploy.stderr}`.slice(-1500),
};

saveReport(report);

console.log("CUTOVER_REPORT_WRITTEN");
console.log(`DEPLOY_OK:${deploy.ok ? "SIM" : "NAO"}`);
console.log(`DEPLOY_URL:${deployUrl ?? "n/a"}`);
console.log(`SUPABASE_AUTH:${report.fases.supabase_auth.ok ? "OK" : "PENDENTE"}`);
console.log(`DOMAIN_ADD:${domainAdd.ok ? "OK" : "VERIFICAR"}`);

process.exit(deploy.ok ? 0 : 1);
