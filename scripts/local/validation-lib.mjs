/**
 * Biblioteca compartilhada — ambiente fechado de validação.
 * Não imprime segredos.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(SCRIPT_DIR, "..", "..");
export const REPORT_PATH = join(PROJECT_ROOT, "scripts", "local", "validation-report.json");
export const STATE_PATH = join(PROJECT_ROOT, "scripts", "local", ".validation-env.json");

export const EXPECTED_TABLES = [
  "profiles",
  "patients",
  "journeys",
  "patient_journey_views",
  "patient_documents",
  "curator_case_workspaces",
  "operational_assignment_events",
  "operational_audit_events",
  "journey_events",
];

export const EXPECTED_MIGRATION_MARKERS = [
  "20260710180000_create_profiles_patients_journeys",
  "20260722180000_create_patient_journey_views",
  "20260723180000_patient_portal",
  "20260724180000_curator_portal",
  "20260725180000_operational_workflow",
  "20260726180000_patient_document_storage",
  "20260727180000_operational_audit_trail",
];

export const ADMIN_EMAIL = "padilhacaiobarbosa@gmail.com";
export const ADMIN_USER_ID = "2406a266-c27d-41a5-aa9a-ff991777f277";

export function loadEnvFile(filePath) {
  const values = {};
  if (!existsSync(filePath)) return values;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    values[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return values;
}

export function loadValidationEnv() {
  const merged = {
    ...loadEnvFile(join(PROJECT_ROOT, ".env.local")),
    ...loadEnvFile(join(SCRIPT_DIR, ".env.admin.local")),
    ...loadEnvFile(join(PROJECT_ROOT, ".env.admin.local")),
  };

  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_NEW_PASSWORD",
    "VALIDATION_BASE_URL",
  ]) {
    if (process.env[key]) merged[key] = process.env[key];
  }

  merged.SUPABASE_URL = merged.SUPABASE_URL ?? merged.NEXT_PUBLIC_SUPABASE_URL;
  merged.SUPABASE_ANON_KEY = merged.SUPABASE_ANON_KEY ?? merged.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  merged.VALIDATION_BASE_URL = merged.VALIDATION_BASE_URL ?? "http://127.0.0.1:3000";

  return merged;
}

export function projectRef(url) {
  if (!url) return null;
  const match = String(url).match(/https:\/\/([^.]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function mask(value) {
  if (!value) return "AUSENTE";
  if (value.length <= 8) return "[SET]";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function writeReport(report) {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
}

export function writeState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

export class MemoryCookieStore {
  #cookies = new Map();

  getAll() {
    return [...this.#cookies.entries()].map(([name, value]) => ({ name, value }));
  }

  setAll(cookiesToSet) {
    for (const { name, value } of cookiesToSet) {
      if (value) this.#cookies.set(name, value);
      else this.#cookies.delete(name);
    }
  }

  header() {
    if (this.#cookies.size === 0) return "";
    return [...this.#cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  clear() {
    this.#cookies.clear();
  }
}

export function createSessionClient(env, store = new MemoryCookieStore()) {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => store.setAll(cookiesToSet),
    },
  });
}

export function createAdminClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function checkTableExists(admin, tableName) {
  const { error } = await admin.from(tableName).select("*", { head: true, count: "exact" });
  if (!error) return { exists: true, error: null };
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (code === "42P01" || message.includes("does not exist") || message.includes("schema cache")) {
    return { exists: false, error: message };
  }
  return { exists: true, error: message };
}

export async function diagnoseDatabaseSchema(admin) {
  const tables = {};
  for (const table of EXPECTED_TABLES) {
    tables[table] = await checkTableExists(admin, table);
  }
  const missing = Object.entries(tables)
    .filter(([, v]) => !v.exists)
    .map(([name]) => name);
  return { tables, missing, ready: missing.length === 0 };
}

export async function staffSignIn(env, email, password, store = new MemoryCookieStore()) {
  const client = createSessionClient(env, store);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`staff_sign_in_failed:${error?.message ?? "no_session"}`);
  }
  return { client, store, session: data.session, userId: data.user.id };
}

export async function patientMagicLinkSession(env, admin, email, redirectTo) {
  const store = new MemoryCookieStore();
  const patientClient = createSessionClient(env, store);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: redirectTo ?? `${env.VALIDATION_BASE_URL}/portal` },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`magic_link_failed:${linkError?.message ?? "no_token"}`);
  }

  const { data: verifyData, error: verifyError } = await patientClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: linkData.properties.hashed_token,
  });

  if (verifyError || !verifyData.session) {
    throw new Error(`magic_link_verify_failed:${verifyError?.message ?? "no_session"}`);
  }

  return { client: patientClient, store, session: verifyData.session, userId: verifyData.user.id };
}

export async function fetchWithCookies(env, store, path, options = {}) {
  const url = `${env.VALIDATION_BASE_URL.replace(/\/$/, "")}${path}`;
  const headers = {
    ...(options.headers ?? {}),
    ...(store.header() ? { Cookie: store.header() } : {}),
  };
  const res = await fetch(url, { ...options, headers, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not json
  }
  return { res, text, json, location: res.headers.get("location") ?? "" };
}

export async function getLoginActionId(env) {
  const res = await fetch(`${env.VALIDATION_BASE_URL}/login`, { redirect: "manual" });
  const html = await res.text();
  const actionId = html.match(/\$ACTION_ID_([a-f0-9]+)/i)?.[1] ?? null;
  return actionId;
}

export class StepRecorder {
  constructor() {
    this.steps = [];
    this.t0 = Date.now();
  }

  record(step) {
    this.steps.push({
      ...step,
      tempo_ms: Date.now() - this.t0,
      timestamp: new Date().toISOString(),
    });
  }
}

export const TRES_OPCOES = [0, 1, 2].map((indice) => ({
  indice,
  nome: `Profissional E2E ${indice + 1}`,
  especialidade: "Cardiologia",
  por_que_esta_aqui: "Trajetória compatível com o caso.",
  por_que_pode_fazer_sentido: "Forças identificadas na curadoria.",
  o_que_esperar: "Acompanhamento estruturado.",
  limitacoes: "Limitações declaradas com transparência.",
  evidencias_resumo: "Evidências documentadas no processo.",
}));
