import type { AuditTrailPort } from "@/application/ports/audit-trail-port";
import type { RecordAuditEventInput } from "@/observability-flow/contracts/audit-event";
import { sanitizeLogPayload } from "@/infrastructure/observability/sanitize-log-payload";
import { createClient } from "@/lib/supabase/server";

export class SupabaseAuditTrailRepository implements AuditTrailPort {
  async record(input: RecordAuditEventInput): Promise<void> {
    const supabase = await createClient();
    const metadata = sanitizeLogPayload(input.metadata ?? {}) as Record<
      string,
      string | number | boolean | null
    >;

    const { error } = await supabase.from("operational_audit_events").insert({
      correlation_id: input.correlationId,
      event_type: input.eventType,
      jornada_id: input.jornadaId ?? null,
      patient_id: input.patientId ?? null,
      curator_id: input.curatorId ?? null,
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole,
      resultado: input.resultado,
      error_code: input.errorCode ?? null,
      duration_ms: input.durationMs,
      metadata,
    });

    if (error) {
      console.error(
        JSON.stringify(
          sanitizeLogPayload({
            scope: "audit_trail",
            step: "record_failed",
            correlationId: input.correlationId,
            eventType: input.eventType,
            errorCode: error.code,
            message: error.message,
          }),
        ),
      );
    }
  }
}

export const auditTrail = new SupabaseAuditTrailRepository();
