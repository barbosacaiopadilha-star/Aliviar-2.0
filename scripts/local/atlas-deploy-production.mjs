/**
 * Operação Atlas — deploy produção com env completo (sem imprimir segredos).
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJECT = "aliviar-os";

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

const env = {
  ...loadEnv(join(ROOT, ".env.local")),
  ...loadEnv(join(ROOT, "scripts", "local", ".env.admin.local")),
};

const productionEnvKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_ALIVIAR_FILM_SRC",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of productionEnvKeys) {
  const value = env[key];
  if (!value) {
    console.log(`SKIP_ENV:${key}`);
    continue;
  }
  const add = run(
    "npx",
    ["vercel", "env", "add", key, "production", "--yes", "--force", "--project", PROJECT],
    value,
  );
  console.log(`${add.ok ? "OK" : "FAIL"}:vercel_env:${key}`);
}

const deployArgs = ["vercel", "deploy", "--prod", "--yes", "--no-color", "--project", PROJECT];
for (const key of productionEnvKeys) {
  if (env[key]) deployArgs.push("-e", `${key}=${env[key]}`);
}

const deploy = run("npx", deployArgs);
process.stdout.write(deploy.stdout);
process.stderr.write(deploy.stderr);

const output = `${deploy.stdout}\n${deploy.stderr}`;
const urls = [...new Set(output.match(/https:\/\/[^\s]+\.vercel\.app/g) ?? [])];
const deployUrl = urls.at(-1) ?? null;

console.log(`DEPLOY_OK:${deploy.ok ? "SIM" : "NAO"}`);
console.log(`DEPLOY_URL:${deployUrl ?? "n/a"}`);
console.log(`PRODUCTION_ALIAS:https://aliviar-os.vercel.app`);

process.exit(deploy.ok ? 0 : 1);
