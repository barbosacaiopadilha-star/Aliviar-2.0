import type {
  AuditActorRole,
  OperationalAuditEventType,
  RecordAuditEventInput,
} from "@/observability-flow/contracts/audit-event";
import { auditTrail } from "@/infrastructure/observability/supabase-audit-trail";
import { createCorrelationId, CORRELATION_ID_HEADER } from "@/infrastructure/observability/correlation-id";
import { logStructuredOperation } from "@/infrastructure/observability/structured-log";

const AUDITABLE_EVENTS = new Set<OperationalAuditEventType>([
  "LOGIN",
  "UPLOAD",
  "JORNADA_ALTERADA",
  "SESSAO_INICIO",
  "SESSAO_FIM",
  "OPCOES_REGISTRADAS",
  "APROVACAO",
  "PUBLICACAO",
  "ESCOLHA_PACIENTE",
  "CONFIG_ALTERADA",
  "USUARIO_ALTERADO",
  "FEATURE_FLAG_ALTERADA",
  "CURATOR_FAVORITO",
  "CURATOR_NOTA",
  "CURATOR_CHECKLIST",
  "CURATOR_TEMPLATE",
  "NOTIFICACAO_GERADA",
  "NOTIFICACAO_LIDA",
  "NOTIFICACAO_PREFERENCIA",
  "FEEDBACK_REGISTRADO",
  "INCIDENTE_CRIADO",
  "INCIDENTE_ATUALIZADO",
  "INCIDENTE_ENCERRADO",
]);

export interface InstrumentOperationInput {
  operationType: OperationalAuditEventType;
  correlationId?: string;
  jornadaId?: string | null;
  patientId?: string | null;
  curatorId?: string | null;
  actorId?: string | null;
  actorRole: AuditActorRole;
  metadata?: Record<string, string | number | boolean | null>;
  execute: () => Promise<Response>;
}

function attachCorrelationHeader(response: Response, correlationId: string): Response {
  const headers = new Headers(response.headers);
  headers.set(CORRELATION_ID_HEADER, correlationId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function recordAudit(input: RecordAuditEventInput): Promise<void> {
  if (!AUDITABLE_EVENTS.has(input.eventType)) return;
  await auditTrail.record(input);
}

export async function instrumentOperation(input: InstrumentOperationInput): Promise<Response> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const started = performance.now();

  try {
    const response = await input.execute();
    const durationMs = Math.round(performance.now() - started);
    const success = response.ok;
    const errorCode = success ? null : `HTTP_${response.status}`;

    logStructuredOperation({
      correlationId,
      operationType: input.operationType,
      jornadaId: input.jornadaId,
      patientId: input.patientId,
      curatorId: input.curatorId,
      actorId: input.actorId,
      durationMs,
      result: success ? "success" : "error",
      errorCode,
      metadata: input.metadata,
    });

    await recordAudit({
      correlationId,
      eventType: input.operationType,
      jornadaId: input.jornadaId,
      patientId: input.patientId,
      curatorId: input.curatorId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      resultado: success ? "SUCESSO" : "FALHA",
      errorCode,
      durationMs,
      metadata: input.metadata,
    });

    return attachCorrelationHeader(response, correlationId);
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    const errorCode = error instanceof Error ? error.name : "UNKNOWN_ERROR";

    logStructuredOperation({
      correlationId,
      operationType: input.operationType,
      jornadaId: input.jornadaId,
      patientId: input.patientId,
      curatorId: input.curatorId,
      actorId: input.actorId,
      durationMs,
      result: "error",
      errorCode,
      metadata: input.metadata,
    });

    await recordAudit({
      correlationId,
      eventType: input.operationType,
      jornadaId: input.jornadaId,
      patientId: input.patientId,
      curatorId: input.curatorId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      resultado: "FALHA",
      errorCode,
      durationMs,
      metadata: input.metadata,
    });

    throw error;
  }
}

export async function recordOperationalAudit(
  input: Omit<RecordAuditEventInput, "durationMs" | "correlationId"> & {
    correlationId?: string;
    durationMs?: number;
  },
): Promise<string> {
  const correlationId = input.correlationId ?? createCorrelationId();
  const durationMs = input.durationMs ?? 0;

  logStructuredOperation({
    correlationId,
    operationType: input.eventType,
    jornadaId: input.jornadaId,
    patientId: input.patientId,
    curatorId: input.curatorId,
    actorId: input.actorId,
    durationMs,
    result: input.resultado === "SUCESSO" ? "success" : "error",
    errorCode: input.errorCode,
    metadata: input.metadata,
  });

  await recordAudit({ ...input, correlationId, durationMs });
  return correlationId;
}
