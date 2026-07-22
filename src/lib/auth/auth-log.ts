import { maskEntityId } from "@/infrastructure/observability/correlation-id";
import { logStructuredOperation } from "@/infrastructure/observability/structured-log";
import { recordOperationalAudit } from "api/shared/observability/instrument-operation";

type AuthLogPayload = {
  step: string;
  code?: string;
  route?: string;
  hasSession?: boolean;
  userIdMasked?: string;
  correlationId?: string;
};

export function logAuthEvent(payload: AuthLogPayload): void {
  const correlationId = payload.correlationId;
  logStructuredOperation({
    correlationId: correlationId ?? "auth-local",
    operationType: "LOGIN",
    actorId: payload.userIdMasked ?? null,
    durationMs: 0,
    result: payload.hasSession ? "success" : "error",
    errorCode: payload.code ?? null,
    metadata: {
      step: payload.step,
      route: payload.route ?? null,
    },
  });
}

export async function logAuthEventWithAudit(payload: AuthLogPayload & { actorRole?: "STAFF" | "PATIENT" }): Promise<string> {
  const correlationId = await recordOperationalAudit({
    correlationId: payload.correlationId ?? undefined,
    eventType: "LOGIN",
    actorId: null,
    actorRole: payload.actorRole ?? "STAFF",
    resultado: payload.hasSession ? "SUCESSO" : "FALHA",
    errorCode: payload.code ?? null,
    metadata: {
      step: payload.step,
      route: payload.route ?? null,
    },
  });

  logAuthEvent({ ...payload, correlationId });
  return correlationId;
}

export function maskedUserId(userId: string): string {
  return maskEntityId(userId) ?? "***";
}
