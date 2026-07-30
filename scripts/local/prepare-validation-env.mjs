/**
 * Prepara ambiente fechado de validação com um único comando.
 * Orquestra: admin, autenticação, verificação de schema, usuário de teste.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_EMAIL,
  ADMIN_USER_ID,
  SCRIPT_DIR,
  createAdminClient,
  diagnoseDatabaseSchema,
  loadValidationEnv,
  writeReport,
  writeState,
} from "./validation-lib.mjs";

function runNode(scriptName) {
  const result = spawnSync(process.execPath, [join(SCRIPT_DIR, scriptName)], {
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}

async function ensureTestPatientMarker(admin) {
  const email = process.env.VALIDATION_TEST_PATIENT_EMAIL ?? "validation.patient@aliviar.local";
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = existing?.users?.find((u) => u.email === email);
  return { email, exists: Boolean(found), userId: found?.id ?? null };
}

async function main() {
  const env = loadValidationEnv({ comando: "validation:prepare" });
  const steps = [];
  const started = Date.now();

  function step(name, ok, detail = "") {
    steps.push({ name, ok, detail, ms: Date.now() - started });
    console.log(`${ok ? "OK" : "FAIL"}:${name}${detail ? `:${detail}` : ""}`);
  }

  console.log("VALIDATION_PREPARE_START");

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_NEW_PASSWORD", "SUPABASE_ANON_KEY"].filter(
    (k) => !env[k],
  );

  if (missing.length) {
    step("env_required", false, missing.join(","));
    console.log("\nPreencha scripts/local/.env.admin.local:");
    console.log("  SUPABASE_SERVICE_ROLE_KEY=");
    console.log("  ADMIN_NEW_PASSWORD=");
    console.log("  npm run validation:prepare");
    process.exit(2);
  }
  step("env_required", true);

  if (existsSync(join(SCRIPT_DIR, "bootstrap-admin-profile.mjs"))) {
    const code = runNode("bootstrap-admin-profile.mjs");
    step("bootstrap_admin_profile", code === 0, String(code));
  }

  if (existsSync(join(SCRIPT_DIR, "set-admin-password.mjs"))) {
    const code = runNode("set-admin-password.mjs");
    step("set_admin_password", code === 0, String(code));
  }

  if (existsSync(join(SCRIPT_DIR, "validate-admin-auth.mjs"))) {
    const code = runNode("validate-admin-auth.mjs");
    step("validate_admin_auth", code === 0, String(code));
  }

  const admin = createAdminClient(env);
  const schema = await diagnoseDatabaseSchema(admin);
  step("database_schema", schema.ready, schema.missing.join("|") || "ok");

  if (!schema.ready) {
    step(
      "migrations",
      false,
      "Aplicar migrations Aliviar OS — supabase db push ou branch dedicado",
    );
    console.log("\nBLOQUEIO: schema remoto nao corresponde ao codigo Aliviar OS.");
    console.log("Tabelas ausentes:", schema.missing.join(", "));
    console.log("Migrations locais em supabase/migrations/");
  } else {
    step("migrations", true);
  }

  const buckets = await admin.storage.listBuckets();
  const bucketNames = (buckets.data ?? []).map((b) => b.name);
  step("storage_buckets", bucketNames.length > 0, bucketNames.join(",") || "nenhum");

  const testPatient = await ensureTestPatientMarker(admin);
  step("test_patient_marker", true, testPatient.email);

  const diagnoseCode = runNode("diagnose-validation-env.mjs");

  const state = {
    preparado_em: new Date().toISOString(),
    admin_email: ADMIN_EMAIL,
    admin_user_id: ADMIN_USER_ID,
    schema_ready: schema.ready,
    test_patient_email: testPatient.email,
    validation_base_url: env.VALIDATION_BASE_URL,
    steps,
    diagnose_exit: diagnoseCode,
  };
  writeState(state);

  writeReport({
    tipo: "prepare",
    gerado_em: state.preparado_em,
    steps,
    schema,
    buckets: bucketNames,
    pronto: schema.ready && steps.every((s) => s.ok || s.name === "migrations"),
  });

  console.log("VALIDATION_PREPARE_END");
  console.log(`SCHEMA_READY:${schema.ready ? "SIM" : "NAO"}`);
  console.log(`STATE:scripts/local/.validation-env.json`);

  process.exit(schema.ready ? 0 : 1);
}

main().catch((error) => {
  console.error(`PREPARE_FATAL:${error.message}`);
  process.exit(1);
});
