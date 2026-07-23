import { sanitizeLogPayload } from "@/infrastructure/observability/sanitize-log-payload";

export interface PersistenceQueryLog {
  operation: string;
  collection: string;
  entityId?: string;
  journeyId?: string | null;
  patientId?: string | null;
  durationMs: number;
  rowCount?: number;
  errorCode?: string | null;
}

export function logPersistenceQuery(input: PersistenceQueryLog): void {
  const entry = sanitizeLogPayload({
    scope: "persistence_query",
    timestamp: new Date().toISOString(),
    ...input,
    env: process.env.NODE_ENV ?? "unknown",
  });

  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(entry));
    return;
  }
  console.info("[persistence]", entry);
}
