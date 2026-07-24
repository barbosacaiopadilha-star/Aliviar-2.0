import { createServiceRoleClient } from "@/lib/supabase/admin";

export type HealthCheckStatus = "ok" | "degraded" | "down";

export interface HealthCheckItem {
  name: string;
  status: HealthCheckStatus;
  detail: string;
  latency_ms: number | null;
}

export interface HealthReport {
  status: HealthCheckStatus;
  timestamp: string;
  checks: HealthCheckItem[];
  summary: {
    ok: number;
    degraded: number;
    down: number;
  };
}

const EXPECTED_TABLES = [
  "profiles",
  "patients",
  "journeys",
  "patient_journey_views",
  "patient_documents",
  "curator_case_workspaces",
  "operational_assignment_events",
  "operational_audit_events",
  "system_configuration",
  "feature_flags",
] as const;

const CRITICAL_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = performance.now();
  const value = await fn();
  return { value, latencyMs: Math.round(performance.now() - start) };
}

function aggregateStatus(checks: HealthCheckItem[]): HealthCheckStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

export async function runOperationalHealthChecks(): Promise<HealthReport> {
  const checks: HealthCheckItem[] = [];

  for (const key of CRITICAL_ENV) {
    checks.push({
      name: `config:${key}`,
      status: process.env[key] ? "ok" : "down",
      detail: process.env[key] ? "presente" : "ausente",
      latency_ms: null,
    });
  }

  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  checks.push({
    name: "config:SUPABASE_SERVICE_ROLE_KEY",
    status: serviceRoleConfigured ? "ok" : "degraded",
    detail: serviceRoleConfigured ? "presente" : "ausente",
    latency_ms: null,
  });

  let anonSupabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>> | null =
    null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    anonSupabase = await createClient();
  } catch (error) {
    checks.push({
      name: "auth:client",
      status: "down",
      detail: error instanceof Error ? error.message : "client_unavailable",
      latency_ms: null,
    });
  }

  if (anonSupabase) {
    const authCheck = await timed(async () => anonSupabase!.auth.getSession());
    checks.push({
      name: "auth:session",
      status: authCheck.value.error ? "degraded" : "ok",
      detail: authCheck.value.error?.message ?? "session_client_ready",
      latency_ms: authCheck.latencyMs,
    });
  }

  const adminSupabase = createServiceRoleClient();
  if (!adminSupabase) {
    checks.push({
      name: "database:admin_client",
      status: "degraded",
      detail: "service_role_unavailable",
      latency_ms: null,
    });
    for (const table of EXPECTED_TABLES) {
      checks.push({
        name: `migrations:${table}`,
        status: "degraded",
        detail: "service_role_unavailable",
        latency_ms: null,
      });
    }
    checks.push({
      name: "storage:buckets",
      status: "degraded",
      detail: "service_role_unavailable",
      latency_ms: null,
    });
  } else {
    const dbCheck = await timed(async () => adminSupabase.from("journeys").select("id", { head: true }));
    checks.push({
      name: "database:journeys",
      status: dbCheck.value.error ? "down" : "ok",
      detail: dbCheck.value.error?.message ?? "reachable",
      latency_ms: dbCheck.latencyMs,
    });

    for (const table of EXPECTED_TABLES) {
      const tableCheck = await timed(async () =>
        adminSupabase.from(table).select("*", { head: true, count: "exact" }),
      );
      checks.push({
        name: `migrations:${table}`,
        status: tableCheck.value.error ? "down" : "ok",
        detail: tableCheck.value.error?.message ?? "exists",
        latency_ms: tableCheck.latencyMs,
      });
    }

    const storageCheck = await timed(async () => adminSupabase.storage.listBuckets());
    const bucketNames = (storageCheck.value.data ?? []).map((b) => b.name);
    checks.push({
      name: "storage:buckets",
      status: storageCheck.value.error
        ? "down"
        : bucketNames.includes("patient-documents")
          ? "ok"
          : "degraded",
      detail: storageCheck.value.error?.message ?? (bucketNames.join(",") || "none"),
      latency_ms: storageCheck.latencyMs,
    });
  }

  try {
    const { application } = await import("@/infrastructure/composition-root");
    const filasCheck = await timed(async () => application.listarFilasOperacionais.execute());
    checks.push({
      name: "filas:operacionais",
      status: filasCheck.value.ok ? "ok" : "degraded",
      detail: filasCheck.value.ok ? `total:${filasCheck.value.value.total_casos}` : "derivation_failed",
      latency_ms: filasCheck.latencyMs,
    });
  } catch (error) {
    checks.push({
      name: "filas:operacionais",
      status: "degraded",
      detail: error instanceof Error ? error.message : "unavailable",
      latency_ms: null,
    });
  }

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    degraded: checks.filter((c) => c.status === "degraded").length,
    down: checks.filter((c) => c.status === "down").length,
  };

  return {
    status: aggregateStatus(checks),
    timestamp: new Date().toISOString(),
    checks,
    summary,
  };
}
