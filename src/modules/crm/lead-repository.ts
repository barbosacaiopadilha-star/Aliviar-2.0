import type { SupabaseClient } from "@supabase/supabase-js";
import { erroDeBanco } from "@/lib/observability/erros";

import { normalizeLeadSource, normalizeLeadStage, type Lead } from "./lead";

/**
 * Leitura dos leads para a superfície do Atendente.
 *
 * Não há filtro de autorização aqui de propósito: quem decide o que este
 * usuário pode ver é a RLS (`can_access_crm_contact`). Repetir a regra no
 * TypeScript criaria uma segunda autoridade que pode divergir da primeira —
 * e a que erra por excesso é sempre a de fora do banco.
 */

export type LeadListItem = Lead & {
  preferredName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  initialReason: string | null;
  priority: string;
  assignedTo: string | null;
  activeCaseId: string | null;
  /** Case aberto a partir deste lead, se já existir. */
  caseId: string | null;
};

type Row = Record<string, string | null>;

function toLead(row: Row): LeadListItem {
  return {
    id: row.id as string,
    fullName: (row.full_name as string) ?? "",
    preferredName: row.preferred_name,
    phone: row.phone,
    email: row.email,
    phoneNormalized: row.phone_normalized,
    emailNormalized: row.email_normalized,
    city: row.city,
    state: row.state,
    source: normalizeLeadSource(row.source),
    sourceDetail: row.source_detail,
    stage: normalizeLeadStage(row.pipeline_stage),
    qualifiedAt: row.qualified_at,
    patientProfileId: row.patient_profile_id,
    convertedAt: row.converted_at,
    createdAt: row.created_at as string,
    initialReason: row.initial_reason,
    priority: (row.priority as string) ?? "media",
    assignedTo: row.assigned_to,
    activeCaseId: row.active_case_id,
    caseId: null,
  };
}

const COLUNAS =
  "id, full_name, preferred_name, phone, phone_normalized, email, email_normalized, city, state, source, source_detail, pipeline_stage, priority, initial_reason, assigned_to, active_case_id, qualified_at, patient_profile_id, converted_at, created_at, archived_at";

export async function listLeadsForAtendente(client: SupabaseClient): Promise<LeadListItem[]> {
  const { data, error } = await client
    .schema("curadoria")
    .from("crm_contacts")
    .select(COLUNAS)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw erroDeBanco("Não foi possível carregar os leads.", error);
  const leads = ((data ?? []) as Row[]).map(toLead);
  return attachCases(client, leads);
}

export async function getLead(client: SupabaseClient, leadId: string): Promise<LeadListItem | null> {
  const { data, error } = await client
    .schema("curadoria")
    .from("crm_contacts")
    .select(COLUNAS)
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw erroDeBanco("Não foi possível carregar o lead.", error);
  if (!data) return null;
  const [lead] = await attachCases(client, [toLead(data as Row)]);
  return lead;
}

/**
 * Liga o lead ao Case do paciente convertido.
 *
 * O vínculo é pelo paciente, não por uma coluna direta — `crm_contacts` guarda
 * de onde a pessoa veio; o Case pertence ao paciente. Se um dia houver dois
 * Cases para o mesmo paciente, o mais recente é o que o Atendente precisa ver.
 */
async function attachCases(client: SupabaseClient, leads: LeadListItem[]): Promise<LeadListItem[]> {
  const patientIds = leads.map((l) => l.patientProfileId).filter((id): id is string => Boolean(id));
  if (patientIds.length === 0) return leads;

  const { data } = await client
    .schema("curadoria")
    .from("cases")
    .select("id, patient_profile_id, created_at")
    .in("patient_profile_id", patientIds)
    .order("created_at", { ascending: false });

  const porPaciente = new Map<string, string>();
  for (const row of (data ?? []) as Row[]) {
    const pid = row.patient_profile_id as string;
    if (!porPaciente.has(pid)) porPaciente.set(pid, row.id as string);
  }

  return leads.map((lead) => ({
    ...lead,
    caseId: lead.patientProfileId ? (porPaciente.get(lead.patientProfileId) ?? null) : null,
  }));
}

/** Quem pode receber o Case como Curador. Papel real, não indicação. */
export async function listCurators(
  client: SupabaseClient,
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await client
    .schema("curadoria")
    .from("user_roles")
    .select("profile_id, roles!inner(slug), profiles!inner(display_name)")
    .eq("roles.slug", "curador_medico");

  if (error) return [];
  return ((data ?? []) as unknown as { profile_id: string; profiles: { display_name: string } | { display_name: string }[] }[]).map(
    (row) => ({
      id: row.profile_id,
      name: Array.isArray(row.profiles) ? (row.profiles[0]?.display_name ?? "Curador") : row.profiles.display_name,
    }),
  );
}
