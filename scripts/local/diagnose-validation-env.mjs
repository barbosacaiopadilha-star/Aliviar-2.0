/**
 * Diagnóstico automático do ambiente fechado de validação.
 * Gera scripts/local/validation-report.json
 */
import {
  ADMIN_EMAIL,
  ADMIN_USER_ID,
  EXPECTED_MIGRATION_MARKERS,
  createAdminClient,
  diagnoseDatabaseSchema,
  loadValidationEnv,
  projectRef,
  writeReport,
} from "./validation-lib.mjs";

function status(ok, warn = false) {
  if (ok) return "OK";
  if (warn) return "WARN";
  return "FAIL";
}

async function checkDevServer(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/login`, { redirect: "manual" });
    return { ok: res.ok || res.status === 307, status: res.status };
  } catch (error) {
    return { ok: false, status: 0, error: error.message };
  }
}

async function main() {
  const env = loadValidationEnv({ modo: "diagnostico" });
  const report = {
    gerado_em: new Date().toISOString(),
    ambiente: "fechado",
    projeto_ref: projectRef(env.SUPABASE_URL),
    checks: {},
    variaveis: {},
    schema: null,
    storage: null,
    migrations: { esperadas: EXPECTED_MIGRATION_MARKERS, verificacao: "por_tabela" },
    problemas: [],
    pronto: false,
  };

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_NEW_PASSWORD",
  ];

  for (const key of requiredVars) {
    const present = Boolean(env[key]);
    report.variaveis[key] = present ? "PRESENTE" : "AUSENTE";
    report.checks[`env_${key}`] = status(present, key === "SUPABASE_SERVICE_ROLE_KEY");
    if (!present) {
      report.problemas.push({
        classe: "CONFIGURACAO",
        severidade: key.includes("SERVICE") || key.includes("PASSWORD") ? "P0" : "P1",
        mensagem: `${key} ausente`,
      });
    }
  }

  report.checks.env_url_match =
    status(projectRef(env.SUPABASE_URL) === "jfhxtwumrurqghuueawi", true);

  const dev = await checkDevServer(env.VALIDATION_BASE_URL);
  report.checks.dev_server = status(dev.ok);
  report.dev_server = { url: env.VALIDATION_BASE_URL, ...dev };
  if (!dev.ok) {
    report.problemas.push({
      classe: "AMBIENTE",
      severidade: "P1",
      mensagem: `Dev server inacessivel em ${env.VALIDATION_BASE_URL}`,
    });
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient(env);
    report.schema = await diagnoseDatabaseSchema(admin);

    for (const table of report.schema.missing) {
      report.problemas.push({
        classe: "INFRAESTRUTURA",
        severidade: "P0",
        mensagem: `Tabela ausente no banco: ${table}`,
      });
    }

    report.checks.database_schema = status(report.schema.ready);

    const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
    report.storage = {
      ok: !bucketError,
      buckets: (buckets ?? []).map((b) => b.name),
      error: bucketError?.message ?? null,
    };
    report.checks.storage = status(!bucketError, true);

    const { data: adminUser, error: adminUserError } = await admin.auth.admin.getUserById(ADMIN_USER_ID);
    report.checks.admin_auth_user = status(Boolean(adminUser?.user) && !adminUserError);
    if (!adminUser?.user) {
      report.problemas.push({
        classe: "CONFIGURACAO",
        severidade: "P1",
        mensagem: `Usuario admin ${ADMIN_EMAIL} nao encontrado`,
      });
    }

    if (adminUser?.user && env.ADMIN_NEW_PASSWORD) {
      const { createClient } = await import("@supabase/supabase-js");
      const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: signInError } = await anon.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: env.ADMIN_NEW_PASSWORD,
      });
      report.checks.admin_login = status(!signInError);
      if (signInError) {
        report.problemas.push({
          classe: "AUTENTICACAO",
          severidade: "P0",
          mensagem: "Login admin falhou — verificar ADMIN_NEW_PASSWORD",
        });
      }
    }
  } else {
    report.checks.database_schema = status(false);
    report.problemas.push({
      classe: "CONFIGURACAO",
      severidade: "P0",
      mensagem: "SUPABASE_SERVICE_ROLE_KEY ausente — diagnostico de schema bloqueado",
    });
  }

  const p0 = report.problemas.filter((p) => p.severidade === "P0");
  report.pronto = p0.length === 0 && report.schema?.ready === true;
  report.resumo = {
    total_problemas: report.problemas.length,
    p0: p0.length,
    schema_aliviar_os: report.schema?.ready ?? false,
    dev_server: dev.ok,
  };

  writeReport(report);

  console.log("VALIDATION_DIAGNOSE_REPORT");
  console.log(`PROJETO:${report.projeto_ref ?? "?"}`);
  console.log(`PRONTO:${report.pronto ? "SIM" : "NAO"}`);
  console.log(`PROBLEMAS:${report.problemas.length} (P0:${p0.length})`);
  console.log(`SCHEMA_ALIVIAR_OS:${report.schema?.ready ? "SIM" : "NAO"}`);
  console.log(`DEV_SERVER:${dev.ok ? "SIM" : "NAO"}`);
  console.log(`REPORT:${report.gerado_em}`);
  console.log(`FILE:scripts/local/validation-report.json`);

  for (const p of report.problemas) {
    console.log(`PROB:${p.severidade}:${p.classe}:${p.mensagem}`);
  }

  process.exit(report.pronto ? 0 : 1);
}

main().catch((error) => {
  console.error(`DIAGNOSE_FATAL:${error.message}`);
  process.exit(1);
});
