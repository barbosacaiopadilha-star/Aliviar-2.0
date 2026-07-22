import type { OperationalAuditEventType } from "@/observability-flow/contracts/audit-event";
import { maskEntityId } from "@/infrastructure/observability/correlation-id";
import { sanitizeLogPayload } from "@/infrastructure/observability/sanitize-log-payload";

export type OperationLogResult = "success" | "error";

export interface StructuredOperationLogInput {
  correlationId: string;
  operationType: OperationalAuditEventType | string;
  jornadaId?: string | null;
  patientId?: string | null;
  curatorId?: string | null;
  actorId?: string | null;
  durationMs: number;
  result: OperationLogResult;
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
}

export function buildStructuredOperationLog(input: StructuredOperationLogInput): Record<string, unknown> {
  return sanitizeLogPayload({
    scope: "operation",
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId,
    operationType: input.operationType,
    jornadaId: maskEntityId(input.jornadaId),
    patientId: maskEntityId(input.patientId),
    curatorId: maskEntityId(input.curatorId),
    actorId: maskEntityId(input.actorId),
    durationMs: input.durationMs,
    result: input.result,
    errorCode: input.errorCode ?? null,
    metadata: input.metadata ?? {},
    env: process.env.NODE_ENV ?? "unknown",
  });
}

export function logStructuredOperation(input: StructuredOperationLogInput): void {
  const entry = buildStructuredOperationLog(input);
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(entry));
    return;
  }
  console.info("[operation]", entry);
}
