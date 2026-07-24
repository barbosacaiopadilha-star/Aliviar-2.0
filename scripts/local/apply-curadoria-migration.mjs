/**
 * Aplica migration curadoria via Supabase Management API ou instrui uso do CLI.
 * Requer SUPABASE_ACCESS_TOKEN ou DATABASE_URL no ambiente.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadValidationEnv } from "./validation-lib.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, "..", "..");
const MIGRATION_PATH = join(
  PROJECT_ROOT,
  "supabase",
  "migrations",
  "20260734180000_curadoria_schema.sql",
);

const PROJECT_REF = "awdlmeykminwyifnygkm";

async function applyViaManagementApi(sql, accessToken) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `HTTP ${response.status}`);
  }
  return payload;
}

async function main() {
  if (!existsSync(MIGRATION_PATH)) {
    console.error("MIGRATION_NOT_FOUND");
    process.exit(1);
  }

  const sql = readFileSync(MIGRATION_PATH, "utf8");
  const env = loadValidationEnv();
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  console.log("APPLY_CURADORIA_MIGRATION_START");

  if (accessToken) {
    try {
      await applyViaManagementApi(sql, accessToken);
      console.log("APPLY_CURADORIA_MIGRATION_OK:via_management_api");
      return;
    } catch (error) {
      console.error("MANAGEMENT_API_FAILED:", error.message);
    }
  }

  console.log("BLOCKER: supabase link requer SUPABASE_ACCESS_TOKEN");
  console.log("Execute manualmente:");
  console.log(`  npx supabase login`);
  console.log(`  npx supabase link --project-ref ${PROJECT_REF}`);
  console.log(`  npx supabase db push`);
  process.exit(2);
}

main().catch((error) => {
  console.error("APPLY_CURADORIA_MIGRATION_FATAL:", error.message);
  process.exit(1);
});
