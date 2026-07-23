import type { ApiRequestContext } from "@/lib/production/api-request-context";
import { sanitizeLogPayload } from "@/infrastructure/observability/sanitize-log-payload";

export interface ApiRequestLogInput {
  context: ApiRequestContext;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  operation: string;
  demoMode?: boolean;
  errorCode?: string | null;
}

export function logApiRequest(input: ApiRequestLogInput): void {
  const entry = sanitizeLogPayload({
    scope: "api_request",
    timestamp: new Date().toISOString(),
    requestId: input.context.requestId,
    correlationId: input.context.correlationId,
    method: input.method,
    path: input.path,
    status: input.status,
    durationMs: input.durationMs,
    operation: input.operation,
    demoMode: input.demoMode ?? false,
    errorCode: input.errorCode ?? null,
    env: process.env.NODE_ENV ?? "unknown",
  });

  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(entry));
    return;
  }
  console.info("[api]", entry);
}
