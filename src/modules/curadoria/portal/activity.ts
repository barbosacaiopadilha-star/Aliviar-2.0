import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Atividades recentes do Curador — agora vindas do banco.
 *
 * @metodo Engine §5.6 — trilha append-only, sempre com autor e instante
 * @metodo Engine §7 — toda atividade é um evento nomeado, nunca inventado
 *
 * Consolidação estrutural 2026-07-24: este módulo substitui o MOCK_ACTIVITY.
 * As duas fontes reais de "o que aconteceu" são `case_events` (mudanças de
 * status, atribuições) e `case_responsibility_changes` (passagens de bastão).
 * A RLS de ambas já limita o que este Curador pode ver — nenhum filtro de
 * autorização é repetido aqui.
 */

export type ActivityEvent = {
  id: string;
  /** Vocabulário de eventos do Motor (Engine §7) — nunca um verbo inventado. */
  event: string;
  caseId: string;
  patientFirstName: string;
  description: string;
  at: string;
  actor: string;
};

const EVENT_FROM_TYPE: Record<string, string> = {
  created: "CURADORIA_INICIADA",
  status_changed: "STATUS_ALTERADO",
  curator_assigned: "CURADOR_DESIGNADO",
};

type EventRow = {
  id: number;
  case_id: string;
  event_type: string;
  actor_id: string | null;
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
  created_at: string;
};

type HandoffRow = {
  id: string;
  case_id: string;
  new_role: string;
  reason: string;
  changed_by: string;
  changed_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  atendente: "Atendente",
  curador_medico: "Curador",
  concierge: "Concierge",
};

export async function listRecentActivity(supabase: SupabaseClient, limit = 8): Promise<ActivityEvent[]> {
  const [eventsRes, handoffsRes] = await Promise.all([
    supabase
      .from("case_events")
      .select("id, case_id, event_type, actor_id, from_value, to_value, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("case_responsibility_changes")
      .select("id, case_id, new_role, reason, changed_by, changed_at")
      .order("changed_at", { ascending: false })
      .limit(limit),
  ]);

  // Erro em uma das fontes não derruba a outra: o feed mostra o que
  // conseguiu ler. Feed vazio por falha silenciosa seria mentira — mas as
  // duas consultas falharem juntas só acontece se o banco caiu, e aí a
  // página inteira já falhou antes.
  const events = (eventsRes.data ?? []) as EventRow[];
  const handoffs = (handoffsRes.data ?? []) as HandoffRow[];

  // Nomes resolvidos numa consulta só — nunca N+1 no feed.
  const actorIds = [
    ...new Set(
      [...events.map((e) => e.actor_id), ...handoffs.map((h) => h.changed_by)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  const caseIds = [...new Set([...events.map((e) => e.case_id), ...handoffs.map((h) => h.case_id)])];

  const [profilesRes, casesRes] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id, display_name").in("id", actorIds)
      : Promise.resolve({ data: [] }),
    caseIds.length > 0
      ? supabase.from("cases").select("id, patient_profile_id, profiles!cases_patient_profile_id_fkey(display_name)").in("id", caseIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = new Map(
    ((profilesRes.data ?? []) as { id: string; display_name: string }[]).map((p) => [p.id, p.display_name]),
  );
  const patientByCase = new Map(
    ((casesRes.data ?? []) as { id: string; profiles: { display_name: string } | { display_name: string }[] | null }[]).map(
      (c) => {
        const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return [c.id, (p?.display_name ?? "Paciente").split(/\s+/)[0]];
      },
    ),
  );

  const fromEvents: ActivityEvent[] = events.map((e) => ({
    id: `ev-${e.id}`,
    event: EVENT_FROM_TYPE[e.event_type] ?? e.event_type,
    caseId: e.case_id,
    patientFirstName: patientByCase.get(e.case_id) ?? "Paciente",
    description: e.reason ?? (e.to_value ? `Para: ${e.to_value}` : ""),
    at: e.created_at,
    actor: e.actor_id ? (nameById.get(e.actor_id) ?? "Equipe") : "Sistema",
  }));

  const fromHandoffs: ActivityEvent[] = handoffs.map((h) => ({
    id: `rh-${h.id}`,
    event: "RESPONSAVEL_ALTERADO",
    caseId: h.case_id,
    patientFirstName: patientByCase.get(h.case_id) ?? "Paciente",
    description: `Case entregue ao ${ROLE_LABELS[h.new_role] ?? h.new_role}: ${h.reason}`,
    at: h.changed_at,
    actor: nameById.get(h.changed_by) ?? "Equipe",
  }));

  return [...fromEvents, ...fromHandoffs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
