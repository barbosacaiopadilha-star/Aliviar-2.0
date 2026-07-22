import type { AuditSearchFilters, AuditSearchResult } from "@/governance-flow/contracts/admin-view";
import type { OperationalAuditEvent } from "@/observability-flow/contracts/audit-event";
import { createClient } from "@/lib/supabase/server";

export class AuditQueryService {
  async pesquisar(filters: AuditSearchFilters): Promise<AuditSearchResult> {
    const supabase = await createClient();
    const limit = Math.min(filters.limit ?? 50, 200);

    let query = supabase
      .from("operational_audit_events")
      .select(
        "id, correlation_id, event_type, occurred_at, jornada_id, patient_id, curator_id, actor_id, actor_role, resultado, error_code, duration_ms, metadata",
        { count: "exact" },
      )
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (filters.patient_id) query = query.eq("patient_id", filters.patient_id);
    if (filters.jornada_id) query = query.eq("jornada_id", filters.jornada_id);
    if (filters.curator_id) query = query.eq("curator_id", filters.curator_id);
    if (filters.event_type) query = query.eq("event_type", filters.event_type);
    if (filters.from) query = query.gte("occurred_at", filters.from);
    if (filters.to) query = query.lte("occurred_at", filters.to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const items: OperationalAuditEvent[] = (data ?? []).map((row) => ({
      id: row.id,
      correlation_id: row.correlation_id,
      event_type: row.event_type,
      occurred_at: row.occurred_at,
      jornada_id: row.jornada_id,
      patient_id: row.patient_id,
      curator_id: row.curator_id,
      actor_id: row.actor_id,
      actor_role: row.actor_role,
      resultado: row.resultado,
      error_code: row.error_code,
      duration_ms: row.duration_ms,
      metadata: (row.metadata ?? {}) as Record<string, string | number | boolean | null>,
    }));

    return { items, total: count ?? items.length };
  }
}

export const auditQuery = new AuditQueryService();
