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
  status: "ativo" | "arquivado";
  archivedAt: string | null;
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
    status: row.status === "arquivado" ? "arquivado" : "ativo",
    archivedAt: row.archived_at,
    caseId: null,
  };
}

const COLUNAS =
  "id, full_name, preferred_name, phone, phone_normalized, email, email_normalized, city, state, source, source_detail, status, pipeline_stage, priority, initial_reason, assigned_to, active_case_id, qualified_at, patient_profile_id, converted_at, created_at, archived_at";

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

/**
 * QUEM PODE RECEBER UM CASE — pela capability, nunca por leitura direta.
 *
 * Nasceu de um defeito da curadoria simulada (25/08): a ficha do Atendente
 * dizia "Nenhuma pessoa com o papel de Curador está cadastrada" com o Curador
 * cadastrado, e o Case parava na entrega. Eram TRÊS defeitos empilhados:
 *
 * 1 · o embed `profiles!inner(...)` era AMBÍGUO — `user_roles` referencia
 *     `profiles` duas vezes (profile_id e granted_by) — e o PostgREST
 *     recusava a consulta para todo mundo, administrador incluído;
 * 2 · `if (error) return []` engolia a recusa, e a tela concluía com uma
 *     frase falsa — violação da ETAPA 7: exceção nunca vira lista vazia;
 * 3 · a RLS de `user_roles` e `profiles` só responde a administrador, e o
 *     ator padrão do fluxo é o Atendente.
 *
 * O remédio do (3) NÃO é abrir RLS: a guarda G-2.6-2 (CONTRATO_2_6 §16)
 * proíbe policy nova de SELECT em `profiles`, e o instrumento do regime é
 * uma capability com gate interno. `curadoria.equipe_por_papel` devolve id e
 * nome dos papéis INTERNOS para quem é equipe interna — e nada mais.
 */
async function equipePorPapel(
  client: SupabaseClient,
  slug: "curador_medico" | "concierge" | "atendente" | "administrador",
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await client.schema("curadoria").rpc("equipe_por_papel", { _slug: slug });

  if (error) throw erroDeBanco("Não foi possível listar quem pode receber o Case.", error, { slug });

  return ((data ?? []) as { profile_id: string; display_name: string | null }[]).map((linha) => ({
    id: linha.profile_id,
    name: linha.display_name ?? "Sem nome",
  }));
}

/** Quem pode receber o Case como Curador. Papel real, não indicação. */
export async function listCurators(client: SupabaseClient): Promise<{ id: string; name: string }[]> {
  return equipePorPapel(client, "curador_medico");
}

/**
 * Quem pode receber o acompanhamento como Concierge — o destino da passagem
 * de bastão DEPOIS da Curadoria (Correção de Domínio §2). A transferência
 * auditada e o portal do Concierge já existiam; faltava a lista.
 */
export async function listConcierges(client: SupabaseClient): Promise<{ id: string; name: string }[]> {
  return equipePorPapel(client, "concierge");
}
