import type { SupabaseClient } from "@supabase/supabase-js";

import { isResponsibleRole } from "@/modules/cases/responsibility";

import type {
  AppointmentRow,
  CaseRow,
  DashboardSource,
  LeadRow,
  PatientRow,
  TaskRow,
  TeamRow,
} from "./dashboard-metrics";

/**
 * Fonte real dos indicadores executivos.
 *
 * @metodo Correção do Administrador §5 — não exibir métricas sem fonte real
 *
 * Cada consulta é independente e falha sozinha. Quando uma falha, o campo vira
 * `null` e a tela mostra "indisponível" — nunca zero. Zero é uma afirmação
 * sobre o mundo ("não há Cases atrasados"); null é uma afirmação sobre nós
 * ("não conseguimos ler"). Confundir os dois é como um painel executivo
 * mente sem querer.
 */
async function safe<T>(run: () => PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  try {
    const { data, error } = await run();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function loadDashboardSource(client: SupabaseClient): Promise<DashboardSource> {
  const db = client.schema("curadoria");

  const [leadRows, caseRows, handoffRows, taskRows, appointmentRows, patientRows, roleRows] = await Promise.all([
    safe(() =>
      db
        .from("crm_contacts")
        .select("id, source, created_at, qualified_at, converted_at, patient_profile_id, archived_at"),
    ),
    safe(() => db.from("cases").select("id, status, responsible_role, responsible_id, created_at, started_at, closed_at")),
    safe(() => db.from("case_responsibility_changes").select("case_id, new_role, changed_at").eq("new_role", "concierge")),
    safe(() => db.from("crm_tasks").select("id, due_at, completed_at")),
    safe(() => db.from("crm_appointments").select("id, start_at")),
    safe(() => db.from("patient_profiles").select("profile_id, status")),
    safe(() => db.from("user_roles").select("profile_id, roles(slug)")),
  ]);

  // Primeira ida ao Concierge por Case — a passagem que interessa é a
  // primeira; devoluções e reenvios não devem encurtar o tempo de Curadoria.
  const handoff = new Map<string, string>();
  for (const row of (handoffRows ?? []) as { case_id: string; changed_at: string }[]) {
    const atual = handoff.get(row.case_id);
    if (!atual || row.changed_at < atual) handoff.set(row.case_id, row.changed_at);
  }

  const leads: LeadRow[] | null = leadRows
    ? (leadRows as Record<string, string | null>[]).map((r) => ({
        id: r.id as string,
        source: r.source,
        createdAt: r.created_at as string,
        qualifiedAt: r.qualified_at,
        convertedAt: r.converted_at,
        patientProfileId: r.patient_profile_id,
        archivedAt: r.archived_at,
      }))
    : null;

  const cases: CaseRow[] | null = caseRows
    ? (caseRows as Record<string, string | null>[]).map((r) => ({
        id: r.id as string,
        status: (r.status as string) ?? "",
        responsibleRole: isResponsibleRole(r.responsible_role) ? r.responsible_role : null,
        responsibleId: r.responsible_id,
        createdAt: r.created_at as string,
        startedAt: r.started_at,
        closedAt: r.closed_at,
        handedToConciergeAt: handoff.get(r.id as string) ?? null,
      }))
    : null;

  const tasks: TaskRow[] | null = taskRows
    ? (taskRows as Record<string, string | null>[]).map((r) => ({
        id: r.id as string,
        dueAt: r.due_at,
        completedAt: r.completed_at,
      }))
    : null;

  const appointments: AppointmentRow[] | null = appointmentRows
    ? (appointmentRows as Record<string, string>[]).map((r) => ({ id: r.id, startsAt: r.start_at }))
    : null;

  const patients: PatientRow[] | null = patientRows
    ? (patientRows as Record<string, string>[]).map((r) => ({ id: r.profile_id, status: r.status }))
    : null;

  const team: TeamRow[] | null = roleRows
    ? Object.entries(
        (roleRows as { profile_id: string; roles: { slug: string } | { slug: string }[] | null }[]).reduce<
          Record<string, string[]>
        >((acc, row) => {
          const slug = Array.isArray(row.roles) ? row.roles[0]?.slug : row.roles?.slug;
          if (!slug) return acc;
          (acc[row.profile_id] ??= []).push(slug);
          return acc;
        }, {}),
      ).map(([id, roles]) => ({ id, roles }))
    : null;

  return {
    leads,
    cases,
    tasks,
    appointments,
    patients,
    team,
    // Deliberadamente null: `patient_documents` guarda documentos enviados,
    // não documentos *pendentes* — não existe no banco a noção de "faltando".
    // Derivar um número daqui seria inventar. O painel mostra indisponível
    // até que a pendência de documento exista de verdade no domínio.
    pendingDocuments: null,
  };
}
