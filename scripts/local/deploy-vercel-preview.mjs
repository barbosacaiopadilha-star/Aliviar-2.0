/**
 * Deploy preview Vercel — lê env local sem imprimir segredos.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

const env = {
  ...loadEnv(join(ROOT, ".env.local")),
  ...loadEnv(join(ROOT, "scripts", "local", ".env.admin.local")),
};

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
for (const key of required) {
  if (!env[key]) {
    console.error(`MISSING_ENV:${key}`);
    process.exit(1);
  }
  console.log(`OK:${key}`);
}

const args = ["vercel", "deploy", "--yes", "--no-color", "--name", "aliviar-os"];
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ALIVIAR_FILM_SRC",
]) {
  if (env[key]) args.push("-e", `${key}=${env[key]}`);
}

const result = spawnSync("npx", args, {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const urls = [...new Set(output.match(/https:\/\/[^\s]+\.vercel\.app/g) ?? [])];
const preview = urls.at(-1);
if (preview) {
  console.log(`PREVIEW_URL:${preview}`);
} else {
  console.error("PREVIEW_URL_NOT_FOUND");
  console.log(output.slice(-3000));
  process.exit(1);
}
