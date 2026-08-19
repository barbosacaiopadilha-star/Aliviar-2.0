import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeNextActionAt } from "./next-action";
import {
  allowedNextStages,
  isPipelineStage,
  isTransitionAllowed,
  resolveStageTransitionContext,
  type PipelineStage,
} from "./pipeline";
import { hasDeliveredCuradoria } from "@/modules/curadoria/delivery-contract";

import { LEAD_EDITABLE_STAGES, projectPipelineStage } from "./pipeline-projection";
import { normalizeEmail, normalizePhone } from "./phone";
import type {
  ChangePipelineStageInput,
  CreateAppointmentInput,
  CreateContactInput,
  CreateInteractionInput,
  CreateTaskInput,
  UpdateAppointmentInput,
  UpdateContactInput,
} from "./schema";
import type {
  AppointmentStatus,
  AppointmentType,
  ConsentStatus,
  ContactSource,
  ContactStatus,
  CrmAppointmentSummary,
  CrmCaseSummary,
  CrmContactDetail,
  CrmContactSummary,
  CrmDashboardData,
  CrmInteraction,
  CrmTaskSummary,
  CrmTimelineEntry,
  InteractionChannel,
  InteractionDirection,
  InteractionType,
  InteractionVisibility,
  Priority,
  TaskStatus,
  TaskType,
} from "./types";

const CONTACT_COLUMNS =
  "id, full_name, preferred_name, phone, phone_normalized, email, email_normalized, city, state, source, source_detail, status, pipeline_stage, assigned_to, priority, initial_reason, preferred_channel, consent_status, consent_recorded_at, last_interaction_at, next_action_at, active_case_id, patient_profile_id, archived_at, created_at, updated_at";

type ContactRow = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  phone: string | null;
  phone_normalized: string | null;
  email: string | null;
  email_normalized: string | null;
  city: string | null;
  state: string | null;
  source: string;
  source_detail: string | null;
  status: string;
  pipeline_stage: string;
  assigned_to: string | null;
  priority: string;
  initial_reason: string | null;
  preferred_channel: string | null;
  consent_status: string;
  consent_recorded_at: string | null;
  last_interaction_at: string | null;
  next_action_at: string | null;
  active_case_id: string | null;
  patient_profile_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

async function namesByProfileIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(profileIds.filter(Boolean)));
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  return new Map((data ?? []).map((row) => [row.id as string, (row.display_name as string | null) ?? "Sem nome"]));
}

function mapContactSummary(row: ContactRow, names: Map<string, string>, caseTitle?: string | null): CrmContactSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    preferredName: row.preferred_name,
    phone: row.phone,
    phoneNormalized: row.phone_normalized,
    email: row.email,
    emailNormalized: row.email_normalized,
    city: row.city,
    state: row.state,
    source: row.source as ContactSource,
    sourceDetail: row.source_detail,
    status: row.status as ContactStatus,
    pipelineStage: row.pipeline_stage as PipelineStage,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to ? (names.get(row.assigned_to) ?? "Sem nome") : null,
    priority: row.priority as Priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastInteractionAt: row.last_interaction_at,
    nextActionAt: row.next_action_at,
    archivedAt: row.archived_at,
    consentStatus: row.consent_status as ConsentStatus,
    consentRecordedAt: row.consent_recorded_at,
    activeCaseId: row.active_case_id,
    activeCaseTitle: caseTitle ?? null,
    patientProfileId: row.patient_profile_id,
  };
}

function mapContactDetail(row: ContactRow, names: Map<string, string>, caseTitle?: string | null): CrmContactDetail {
  return {
    ...mapContactSummary(row, names, caseTitle),
    initialReason: row.initial_reason,
    preferredChannel: (row.preferred_channel as InteractionChannel | null) ?? null,
  };
}

export async function listContacts(
  supabase: SupabaseClient,
  options: { status?: "ativo" | "arquivado" } = {},
): Promise<CrmContactSummary[]> {
  const query = supabase
    .from("crm_contacts")
    .select(CONTACT_COLUMNS)
    .eq("status", options.status ?? "ativo")
    .order("updated_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ContactRow[];
  const names = await namesByProfileIds(
    supabase,
    rows.map((row) => row.assigned_to ?? ""),
  );

  const caseIds = rows.map((row) => row.active_case_id).filter((id): id is string => Boolean(id));
  const caseTitles = await caseTitlesByIds(supabase, caseIds);

  return rows.map((row) =>
    mapContactSummary(row, names, row.active_case_id ? caseTitles.get(row.active_case_id) : null),
  );
}

// CONVERGÊNCIA B3: título derivado do Case canônico (curadoria.cases não tem
// coluna de título — o "título" é a pessoa, que é o que o Atendente procura).
async function caseTitlesByIds(supabase: SupabaseClient, caseIds: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(caseIds));
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("cases").select("id, patient_profile_id").in("id", unique);
  const rows = (data ?? []) as { id: string; patient_profile_id: string }[];
  const names = await namesByProfileIds(supabase, rows.map((row) => row.patient_profile_id));
  return new Map(
    rows.map((row) => [row.id, `Case — ${names.get(row.patient_profile_id) ?? "Paciente"}`]),
  );
}

export async function getContactById(supabase: SupabaseClient, contactId: string): Promise<CrmContactDetail | null> {
  const { data, error } = await supabase.from("crm_contacts").select(CONTACT_COLUMNS).eq("id", contactId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ContactRow;
  const names = await namesByProfileIds(supabase, [row.assigned_to ?? ""]);
  let caseTitle: string | null = null;
  if (row.active_case_id) {
    const titles = await caseTitlesByIds(supabase, [row.active_case_id]);
    caseTitle = titles.get(row.active_case_id) ?? null;
  }
  return mapContactDetail(row, names, caseTitle);
}

export async function writeCrmAudit(
  supabase: SupabaseClient,
  input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    previousValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    context?: Record<string, unknown> | null;
  },
): Promise<void> {
  // Escrita de sistema (ex.: lead do site via service role) — sem sessão humana.
  if (input.actorId === null) {
    const { error } = await supabase.from("crm_audit_log").insert({
      actor_id: null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      previous_values: input.previousValues ?? null,
      new_values: input.newValues ?? null,
      context: input.context ?? null,
    });
    if (error) throw new Error(error.message);
    return;
  }

  // Usuário autenticado: actor_id é sempre auth.uid() — ignoramos input.actorId.
  const { error } = await supabase.rpc("append_crm_audit_log", {
    _action: input.action,
    _entity_type: input.entityType,
    _entity_id: input.entityId,
    _previous_values: input.previousValues ?? null,
    _new_values: input.newValues ?? null,
    _context: input.context ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function refreshNextActionForContact(supabase: SupabaseClient, contactId: string): Promise<void> {
  const [tasks, appointments, contact] = await Promise.all([
    listTasksForContact(supabase, contactId),
    listAppointmentsForContact(supabase, contactId),
    getContactById(supabase, contactId),
  ]);

  const { nextActionAt } = computeNextActionAt({
    manualNextActionAt: contact?.nextActionAt,
    tasks,
    appointments,
  });

  await supabase.from("crm_contacts").update({ next_action_at: nextActionAt }).eq("id", contactId);
}

// CONVERGÊNCIA B2 (2026-07-25): criar contato NÃO cria mais Case. Lead não é
// Case — o Case nasce exclusivamente quando o Atendente o abre
// (open_case_from_lead), nunca de um formulário. A criação automática que
// existia aqui era a violação de domínio que gerou as fixtures do B1.
export async function createContact(
  supabase: SupabaseClient,
  input: CreateContactInput,
  actorId: string | null,
): Promise<{ contactId: string }> {
  const phoneNormalized = normalizePhone(input.phone);
  const emailNormalized = normalizeEmail(input.email);
  const now = new Date().toISOString();

  // O id é gerado aqui, e o INSERT não pede `RETURNING`.
  //
  // Por quê: a policy de SELECT de `crm_contacts` é `can_access_crm_contact(id)`,
  // que resolve o acesso com uma subconsulta na PRÓPRIA tabela. A linha que
  // está sendo inserida ainda não é visível a essa subconsulta, então o
  // `RETURNING` do `.select()` nunca satisfaz a policy — o Postgres levanta
  // 42501 e desfaz a transação inteira. O INSERT sozinho passa e persiste; era
  // só o retorno que falhava, para qualquer papel.
  //
  // Conhecer o id de antemão remove a leitura desnecessária sem afrouxar
  // nenhuma autorização: quem não pode inserir continua não inserindo.
  const contactId = randomUUID();

  const { error: contactError } = await supabase
    .from("crm_contacts")
    .insert({
      id: contactId,
      full_name: input.fullName.trim(),
      preferred_name: input.preferredName?.trim() || null,
      phone: input.phone?.trim() || null,
      phone_normalized: phoneNormalized,
      email: input.email?.trim() || null,
      email_normalized: emailNormalized,
      city: input.city?.trim() || null,
      state: input.state?.trim().toUpperCase() || null,
      source: input.source,
      source_detail: input.sourceDetail?.trim() || null,
      assigned_to: input.assignedTo !== undefined ? input.assignedTo : actorId,
      priority: input.priority,
      initial_reason: input.initialReason?.trim() || null,
      preferred_channel: input.preferredChannel ?? null,
      consent_status: input.consentStatus,
      consent_recorded_at: input.consentStatus === "concedido" ? now : null,
      next_action_at: input.nextActionAt ?? null,
      pipeline_stage: "new_contact",
      status: "ativo",
    });

  if (contactError) throw new Error(contactError.message ?? "Não foi possível criar o contato.");

  if (input.initialNote?.trim() && actorId) {
    await createInteraction(supabase, {
      contactId,
      type: "anotacao_interna",
      channel: input.preferredChannel ?? "interno",
      direction: "interno",
      content: input.initialNote.trim(),
      visibility: "operacional",
    }, actorId);
  }

  await writeCrmAudit(supabase, {
    actorId,
    action: "contact_created",
    entityType: "crm_contact",
    entityId: contactId,
    newValues: { fullName: input.fullName, source: input.source },
  });

  await refreshNextActionForContact(supabase, contactId);
  return { contactId };
}

export async function updateContact(
  supabase: SupabaseClient,
  input: UpdateContactInput,
  actorId: string,
): Promise<void> {
  const existing = await getContactById(supabase, input.contactId);
  if (!existing) throw new Error("Contato não encontrado.");

  const patch: Record<string, unknown> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName.trim();
  if (input.preferredName !== undefined) patch.preferred_name = input.preferredName;
  if (input.phone !== undefined) {
    patch.phone = input.phone;
    patch.phone_normalized = normalizePhone(input.phone);
  }
  if (input.email !== undefined) {
    patch.email = input.email;
    patch.email_normalized = normalizeEmail(input.email);
  }
  if (input.city !== undefined) patch.city = input.city;
  if (input.state !== undefined) patch.state = input.state ? input.state.toUpperCase() : null;
  if (input.source !== undefined) patch.source = input.source;
  if (input.sourceDetail !== undefined) patch.source_detail = input.sourceDetail;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.initialReason !== undefined) patch.initial_reason = input.initialReason;
  if (input.preferredChannel !== undefined) patch.preferred_channel = input.preferredChannel;
  if (input.consentStatus !== undefined) {
    patch.consent_status = input.consentStatus;
    patch.consent_recorded_at = input.consentStatus === "concedido" ? new Date().toISOString() : existing.consentRecordedAt;
  }
  if (input.nextActionAt !== undefined) patch.next_action_at = input.nextActionAt;

  const { error } = await supabase.from("crm_contacts").update(patch).eq("id", input.contactId);
  if (error) throw new Error(error.message);

  await writeCrmAudit(supabase, {
    actorId,
    action: "contact_updated",
    entityType: "crm_contact",
    entityId: input.contactId,
    previousValues: { assignedTo: existing.assignedTo, priority: existing.priority },
    newValues: patch,
  });

  await refreshNextActionForContact(supabase, input.contactId);
}

export async function archiveContact(
  supabase: SupabaseClient,
  contactId: string,
  actorId: string,
  reason?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("crm_contacts")
    .update({ status: "arquivado", archived_at: now, pipeline_stage: "archived" })
    .eq("id", contactId);
  if (error) throw new Error(error.message);

  await writeCrmAudit(supabase, {
    actorId,
    action: "contact_archived",
    entityType: "crm_contact",
    entityId: contactId,
    context: reason ? { reason } : null,
  });
}

export async function changePipelineStage(
  supabase: SupabaseClient,
  input: ChangePipelineStageInput,
  actorId: string,
  roles: string[],
): Promise<void> {
  const contact = await getContactById(supabase, input.contactId);
  if (!contact) throw new Error("Contato não encontrado.");
  if (!isPipelineStage(contact.pipelineStage)) throw new Error("Etapa atual inválida.");
  if (!isPipelineStage(input.toStage)) throw new Error("Etapa de destino inválida.");

  // CONVERGÊNCIA B2: a etapa editável é a do LEAD (fase de Atendimento).
  // Da entrega ao Curador em diante, a etapa é PROJETADA do Case canônico
  // (pipeline-projection.ts) — escrever aqui recriaria o segundo estado que
  // a Correção de Domínio proibiu. Estado desconhecido para, nunca converte.
  if (!LEAD_EDITABLE_STAGES.includes(input.toStage)) {
    throw new Error(
      "Esta etapa é derivada do Case — ela muda pela transferência de responsabilidade, não por aqui.",
    );
  }

  const caseId = input.caseId ?? contact.activeCaseId;
  let crmCase: CrmCaseSummary | null = null;
  if (caseId) {
    crmCase = await getCaseById(supabase, caseId);
  }

  const appointments = await listAppointmentsForContact(supabase, input.contactId);
  const hasInitialConsultationAppointment = appointments.some(
    (a) => a.type === "consulta_inicial" && a.status !== "cancelado" && a.status !== "nao_compareceu",
  );

  const context = resolveStageTransitionContext(roles, {
    hasInitialConsultationAppointment,
    hasResponsibleCurator: Boolean(crmCase?.responsibleCuratorId),
    explicitCompletionConfirmed: input.explicitCompletionConfirmed,
  });

  if (!isTransitionAllowed(contact.pipelineStage, input.toStage, context)) {
    throw new Error("Transição de etapa não permitida.");
  }

  const fromStage = contact.pipelineStage;
  await supabase
    .from("crm_contacts")
    .update({ pipeline_stage: input.toStage })
    .eq("id", input.contactId);

  // CONVERGÊNCIA B2: crm_cases não recebe mais escrita de etapa — a etapa
  // pós-Atendimento é projeção derivada do Case canônico.

  await createInteraction(
    supabase,
    {
      contactId: input.contactId,
      caseId: caseId ?? undefined,
      type: "atualizacao_status",
      channel: "interno",
      direction: "interno",
      subject: "Mudança de etapa",
      content: input.reason?.trim() || `Etapa alterada para ${input.toStage}.`,
      visibility: "operacional",
    },
    actorId,
  );

  await writeCrmAudit(supabase, {
    actorId,
    action: "pipeline_stage_changed",
    entityType: "crm_contact",
    entityId: input.contactId,
    previousValues: { pipelineStage: fromStage },
    newValues: { pipelineStage: input.toStage },
    context: input.reason ? { reason: input.reason } : null,
  });
}

// ---------------------------------------------------------------------------
// CONVERGÊNCIA B3 (2026-07-25): getCaseById e listCasesForContact deixaram de
// ler crm_cases. Leem o Case canônico (curadoria.cases) e DERIVAM a etapa
// pela projeção — a mesma fonte única de pipeline-projection.ts.
//
// `leadStageFallback`: quando a projeção diz que a etapa ainda é fase de
// LEAD (Case com o Atendente / sem regra de Case), a etapa exibida é a do
// contato — o último estado declarado por um humano; nunca inventamos uma.
// ---------------------------------------------------------------------------

type CanonicalCaseRow = {
  id: string;
  patient_profile_id: string;
  status: string;
  responsible_id: string | null;
  responsible_role: string | null;
  assigned_curator_id: string | null;
  started_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

const CANONICAL_CASE_COLUMNS =
  "id, patient_profile_id, status, responsible_id, responsible_role, assigned_curator_id, started_at, closed_at, created_at, updated_at";

async function mapCanonicalCase(
  supabase: SupabaseClient,
  row: CanonicalCaseRow,
  leadStageFallback: PipelineStage,
): Promise<CrmCaseSummary> {
  // A pergunta é do contrato canônico, não da tabela: o CRM não sabe — e não
  // deve saber — se a entrega veio da Curadoria do Método ou do motor antigo.
  // Antes ele consultava `final_curadoria_deliveries` direto, e por isso um
  // Case entregue pelo Método chegava aqui como não entregue, travando o
  // quadro do Concierge antes de `report_delivered`.
  const [delivered, names] = await Promise.all([
    hasDeliveredCuradoria(supabase, row.id),
    namesByProfileIds(supabase, [row.patient_profile_id, row.responsible_id ?? ""]),
  ]);

  const projection = projectPipelineStage({
    status: row.status,
    responsibleRole: (row.responsible_role as "atendente" | "curador_medico" | "concierge" | null) ?? null,
    startedAt: row.started_at,
    closedAt: row.closed_at,
    delivered,
  });

  const stage: PipelineStage = projection.kind === "case" ? projection.stage : leadStageFallback;
  const responsibleName = row.responsible_id ? (names.get(row.responsible_id) ?? null) : null;

  return {
    id: row.id,
    contactId: "",
    title: `Case — ${names.get(row.patient_profile_id) ?? "Paciente"}`,
    summary: null,
    status: row.closed_at ? "fechado" : "aberto",
    pipelineStage: stage,
    responsibleConciergeId: row.responsible_role === "concierge" ? row.responsible_id : null,
    responsibleConciergeName: row.responsible_role === "concierge" ? responsibleName : null,
    responsibleCuratorId:
      row.responsible_role === "curador_medico" ? row.responsible_id : row.assigned_curator_id,
    responsibleCuratorName: row.responsible_role === "curador_medico" ? responsibleName : null,
    priority: "media",
    openedAt: row.created_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCaseById(
  supabase: SupabaseClient,
  caseId: string,
  leadStageFallback: PipelineStage = "in_service",
): Promise<CrmCaseSummary | null> {
  const { data, error } = await supabase
    .from("cases")
    .select(CANONICAL_CASE_COLUMNS)
    .eq("id", caseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCanonicalCase(supabase, data as CanonicalCaseRow, leadStageFallback);
}

export async function listCasesForContact(
  supabase: SupabaseClient,
  contactId: string,
): Promise<CrmCaseSummary[]> {
  // O vínculo canônico contato→Case é a PESSOA: o contato aponta para o
  // paciente que originou (patient_profile_id) e os Cases são do paciente.
  const contact = await getContactById(supabase, contactId);
  if (!contact) return [];

  // Sem paciente vinculado (lead não convertido) → nenhum Case, por
  // definição do domínio: lead não é Case.
  if (!contact.patientProfileId) return [];
  const leadStage = contact.pipelineStage;

  const { data, error } = await supabase
    .from("cases")
    .select(CANONICAL_CASE_COLUMNS)
    .eq("patient_profile_id", contact.patientProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CanonicalCaseRow[];
  const mapped = await Promise.all(rows.map((row) => mapCanonicalCase(supabase, row, leadStage)));
  return mapped.map((entry) => ({ ...entry, contactId }));
}

export async function createInteraction(
  supabase: SupabaseClient,
  input: CreateInteractionInput,
  actorId: string,
): Promise<CrmInteraction> {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_interactions")
    .insert({
      contact_id: input.contactId,
      case_id: input.caseId ?? null,
      type: input.type,
      channel: input.channel,
      direction: input.direction,
      subject: input.subject?.trim() || null,
      content: input.content.trim(),
      occurred_at: occurredAt,
      created_by: actorId,
      external_reference: input.externalReference?.trim() || null,
      visibility: input.visibility,
    })
    .select(
      "id, contact_id, case_id, type, channel, direction, subject, content, occurred_at, created_by, created_at, external_reference, visibility",
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Não foi possível registrar a interação.");

  await supabase
    .from("crm_contacts")
    .update({ last_interaction_at: occurredAt })
    .eq("id", input.contactId);

  const names = await namesByProfileIds(supabase, [actorId]);
  return {
    id: data.id as string,
    contactId: data.contact_id as string,
    caseId: (data.case_id as string | null) ?? null,
    type: data.type as InteractionType,
    channel: data.channel as InteractionChannel,
    direction: data.direction as InteractionDirection,
    subject: (data.subject as string | null) ?? null,
    content: data.content as string,
    occurredAt: data.occurred_at as string,
    createdBy: data.created_by as string,
    createdByName: names.get(actorId) ?? null,
    createdAt: data.created_at as string,
    externalReference: (data.external_reference as string | null) ?? null,
    visibility: data.visibility as InteractionVisibility,
  };
}

export async function listInteractionsForContact(supabase: SupabaseClient, contactId: string): Promise<CrmInteraction[]> {
  const { data, error } = await supabase
    .from("crm_interactions")
    .select(
      "id, contact_id, case_id, type, channel, direction, subject, content, occurred_at, created_by, created_at, external_reference, visibility",
    )
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const names = await namesByProfileIds(supabase, rows.map((row) => row.created_by as string));
  return rows.map((row) => ({
    id: row.id as string,
    contactId: row.contact_id as string,
    caseId: (row.case_id as string | null) ?? null,
    type: row.type as InteractionType,
    channel: row.channel as InteractionChannel,
    direction: row.direction as InteractionDirection,
    subject: (row.subject as string | null) ?? null,
    content: row.content as string,
    occurredAt: row.occurred_at as string,
    createdBy: row.created_by as string,
    createdByName: names.get(row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    externalReference: (row.external_reference as string | null) ?? null,
    visibility: row.visibility as InteractionVisibility,
  }));
}

function mapTaskRow(
  row: Record<string, unknown>,
  contactNames: Map<string, string>,
  assigneeNames: Map<string, string>,
): CrmTaskSummary {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    contactName: contactNames.get(row.contact_id as string) ?? "Sem nome",
    caseId: (row.case_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    type: row.type as TaskType,
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    assignedTo: row.assigned_to as string,
    assignedToName: assigneeNames.get(row.assigned_to as string) ?? null,
    dueAt: (row.due_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listTasks(supabase: SupabaseClient): Promise<CrmTaskSummary[]> {
  const { data, error } = await supabase
    .from("crm_tasks")
    .select(
      "id, contact_id, case_id, title, description, type, status, priority, assigned_to, due_at, completed_at, created_by, created_at, updated_at",
    )
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return enrichTasks(supabase, data ?? []);
}

export async function listTasksForContact(supabase: SupabaseClient, contactId: string): Promise<CrmTaskSummary[]> {
  const { data, error } = await supabase
    .from("crm_tasks")
    .select(
      "id, contact_id, case_id, title, description, type, status, priority, assigned_to, due_at, completed_at, created_by, created_at, updated_at",
    )
    .eq("contact_id", contactId)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return enrichTasks(supabase, data ?? []);
}

async function enrichTasks(supabase: SupabaseClient, rows: Record<string, unknown>[]): Promise<CrmTaskSummary[]> {
  const contactIds = rows.map((row) => row.contact_id as string);
  const assigneeIds = rows.map((row) => row.assigned_to as string);
  const contacts = await supabase.from("crm_contacts").select("id, full_name").in("id", Array.from(new Set(contactIds)));
  const contactNames = new Map((contacts.data ?? []).map((row) => [row.id as string, row.full_name as string]));
  const assigneeNames = await namesByProfileIds(supabase, assigneeIds);
  return rows.map((row) => mapTaskRow(row, contactNames, assigneeNames));
}

export async function createTask(
  supabase: SupabaseClient,
  input: CreateTaskInput,
  actorId: string,
): Promise<CrmTaskSummary> {
  const { data, error } = await supabase
    .from("crm_tasks")
    .insert({
      contact_id: input.contactId,
      case_id: input.caseId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      status: "pendente",
      priority: input.priority,
      assigned_to: input.assignedTo ?? actorId,
      due_at: input.dueAt ?? null,
      created_by: actorId,
    })
    .select(
      "id, contact_id, case_id, title, description, type, status, priority, assigned_to, due_at, completed_at, created_by, created_at, updated_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a tarefa.");

  await writeCrmAudit(supabase, {
    actorId,
    action: "task_created",
    entityType: "crm_task",
    entityId: data.id as string,
    newValues: { title: input.title, contactId: input.contactId },
  });

  await refreshNextActionForContact(supabase, input.contactId);
  const [task] = await enrichTasks(supabase, [data as Record<string, unknown>]);
  return task;
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: TaskStatus,
  actorId: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === "concluida") patch.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("crm_tasks")
    .update(patch)
    .eq("id", taskId)
    .select("contact_id")
    .single();
  if (error) throw new Error(error.message);

  await writeCrmAudit(supabase, {
    actorId,
    action: status === "concluida" ? "task_completed" : "task_updated",
    entityType: "crm_task",
    entityId: taskId,
    newValues: { status },
  });

  await refreshNextActionForContact(supabase, data.contact_id as string);
}

function mapAppointmentRow(
  row: Record<string, unknown>,
  contactNames: Map<string, string>,
  assigneeNames: Map<string, string>,
): CrmAppointmentSummary {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    contactName: contactNames.get(row.contact_id as string) ?? "Sem nome",
    caseId: (row.case_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    startAt: row.start_at as string,
    endAt: (row.end_at as string | null) ?? null,
    type: row.type as AppointmentType,
    status: row.status as AppointmentStatus,
    assignedTo: row.assigned_to as string,
    assignedToName: assigneeNames.get(row.assigned_to as string) ?? null,
    locationOrLink: (row.location_or_link as string | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listAppointments(supabase: SupabaseClient): Promise<CrmAppointmentSummary[]> {
  const { data, error } = await supabase
    .from("crm_appointments")
    .select(
      "id, contact_id, case_id, title, description, start_at, end_at, type, status, assigned_to, location_or_link, created_by, created_at, updated_at",
    )
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return enrichAppointments(supabase, data ?? []);
}

export async function listAppointmentsForContact(
  supabase: SupabaseClient,
  contactId: string,
): Promise<CrmAppointmentSummary[]> {
  const { data, error } = await supabase
    .from("crm_appointments")
    .select(
      "id, contact_id, case_id, title, description, start_at, end_at, type, status, assigned_to, location_or_link, created_by, created_at, updated_at",
    )
    .eq("contact_id", contactId)
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return enrichAppointments(supabase, data ?? []);
}

async function enrichAppointments(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
): Promise<CrmAppointmentSummary[]> {
  const contactIds = rows.map((row) => row.contact_id as string);
  const assigneeIds = rows.map((row) => row.assigned_to as string);
  const contacts = await supabase.from("crm_contacts").select("id, full_name").in("id", Array.from(new Set(contactIds)));
  const contactNames = new Map((contacts.data ?? []).map((row) => [row.id as string, row.full_name as string]));
  const assigneeNames = await namesByProfileIds(supabase, assigneeIds);
  return rows.map((row) => mapAppointmentRow(row, contactNames, assigneeNames));
}

export async function createAppointment(
  supabase: SupabaseClient,
  input: CreateAppointmentInput,
  actorId: string,
): Promise<CrmAppointmentSummary> {
  const { data, error } = await supabase
    .from("crm_appointments")
    .insert({
      contact_id: input.contactId,
      case_id: input.caseId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_at: input.startAt,
      end_at: input.endAt ?? null,
      type: input.type,
      status: "agendado",
      assigned_to: input.assignedTo ?? actorId,
      location_or_link: input.locationOrLink?.trim() || null,
      created_by: actorId,
    })
    .select(
      "id, contact_id, case_id, title, description, start_at, end_at, type, status, assigned_to, location_or_link, created_by, created_at, updated_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar o compromisso.");

  await writeCrmAudit(supabase, {
    actorId,
    action: "appointment_created",
    entityType: "crm_appointment",
    entityId: data.id as string,
    newValues: { title: input.title, contactId: input.contactId },
  });

  await refreshNextActionForContact(supabase, input.contactId);
  const [appointment] = await enrichAppointments(supabase, [data as Record<string, unknown>]);
  return appointment;
}

export async function updateAppointment(
  supabase: SupabaseClient,
  input: UpdateAppointmentInput,
  actorId: string,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.startAt !== undefined) patch.start_at = input.startAt;
  if (input.endAt !== undefined) patch.end_at = input.endAt;
  if (input.status !== undefined) patch.status = input.status;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.locationOrLink !== undefined) patch.location_or_link = input.locationOrLink;

  const { data, error } = await supabase
    .from("crm_appointments")
    .update(patch)
    .eq("id", input.appointmentId)
    .select("contact_id")
    .single();
  if (error) throw new Error(error.message);

  await writeCrmAudit(supabase, {
    actorId,
    action: "appointment_updated",
    entityType: "crm_appointment",
    entityId: input.appointmentId,
    newValues: patch,
  });

  await refreshNextActionForContact(supabase, data.contact_id as string);
}

export async function buildContactTimeline(
  supabase: SupabaseClient,
  contactId: string,
): Promise<CrmTimelineEntry[]> {
  const [interactions, tasks, appointments] = await Promise.all([
    listInteractionsForContact(supabase, contactId),
    listTasksForContact(supabase, contactId),
    listAppointmentsForContact(supabase, contactId),
  ]);

  const entries: CrmTimelineEntry[] = [];

  for (const interaction of interactions) {
    if (interaction.type === "atualizacao_status") {
      entries.push({
        kind: "stage_change",
        at: interaction.occurredAt,
        fromStage: null,
        toStage: "in_service",
        actorName: interaction.createdByName,
      });
    }
    entries.push({ kind: "interaction", at: interaction.occurredAt, interaction });
  }

  for (const task of tasks.filter((t) => t.status === "concluida" && t.completedAt)) {
    entries.push({ kind: "task_completed", at: task.completedAt as string, task });
  }

  for (const appointment of appointments) {
    entries.push({ kind: "appointment", at: appointment.startAt, appointment });
  }

  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return entries;
}

export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<CrmDashboardData> {
  const [contacts, tasks, appointments] = await Promise.all([
    listContacts(supabase),
    listTasks(supabase),
    listAppointments(supabase),
  ]);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const isToday = (iso: string | null) => {
    if (!iso) return false;
    const date = new Date(iso);
    return date >= startOfDay && date <= endOfDay;
  };

  const isOverdue = (iso: string | null) => iso !== null && new Date(iso) < startOfDay;

  const newContacts = contacts.filter(
    (c) => c.pipelineStage === "new_contact" || c.pipelineStage === "first_response_pending",
  );

  const myQueue = contacts.filter((c) => c.assignedTo === userId && c.status === "ativo");

  const dueToday = tasks.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada" && isToday(t.dueAt),
  );

  const overdueTasks = tasks.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada" && isOverdue(t.dueAt),
  );

  const overdueContacts = contacts.filter(
    (c) => c.status === "ativo" && isOverdue(c.nextActionAt),
  );

  const withoutNextAction = contacts.filter(
    (c) =>
      c.status === "ativo" &&
      !c.nextActionAt &&
      !tasks.some(
        (t) =>
          t.contactId === c.id &&
          t.status !== "concluida" &&
          t.status !== "cancelada",
      ),
  );

  const upcomingAppointments = appointments
    .filter((a) => a.status !== "cancelado" && new Date(a.startAt) >= now)
    .slice(0, 10);

  const inServiceStages = ["in_service", "qualification", "proposal_or_contracting"];
  const awaitingContractingStages = ["awaiting_payment", "proposal_or_contracting"];
  const contractedStages = ["contracted", "initial_consultation_scheduling", "initial_consultation_scheduled"];

  return {
    newContacts: newContacts.slice(0, 8),
    myQueue: myQueue.slice(0, 10),
    dueToday: dueToday.slice(0, 10),
    overdueTasks: overdueTasks.slice(0, 10),
    overdueContacts: overdueContacts.slice(0, 10),
    withoutNextAction: withoutNextAction.slice(0, 10),
    upcomingAppointments,
    metrics: {
      newContactsCount: newContacts.length,
      inServiceCount: contacts.filter((c) => inServiceStages.includes(c.pipelineStage)).length,
      awaitingContractingCount: contacts.filter((c) => awaitingContractingStages.includes(c.pipelineStage)).length,
      contractedCount: contacts.filter((c) => contractedStages.includes(c.pipelineStage)).length,
      scheduledConsultationsCount: contacts.filter((c) => c.pipelineStage === "initial_consultation_scheduled").length,
      overdueCount: overdueContacts.length + overdueTasks.length,
    },
  };
}

export function getAllowedStagesForContact(
  contact: CrmContactSummary,
  crmCase: CrmCaseSummary | null,
  appointments: CrmAppointmentSummary[],
  roles: string[],
): PipelineStage[] {
  const hasInitialConsultationAppointment = appointments.some(
    (a) => a.type === "consulta_inicial" && a.status !== "cancelado",
  );
  return allowedNextStages(
    contact.pipelineStage,
    resolveStageTransitionContext(roles, {
      hasInitialConsultationAppointment,
      hasResponsibleCurator: Boolean(crmCase?.responsibleCuratorId),
    }),
  );
}

const CONCIERGE_ACTIVE_STAGES = ["doctor_selected", "scheduling_support"] as const;

export type ConciergeDashboardData = {
  activePatients: CrmContactSummary[];
  pendingTasks: CrmTaskSummary[];
  upcomingAppointments: CrmAppointmentSummary[];
  metrics: {
    activeCount: number;
    pendingTasksCount: number;
    appointmentsCount: number;
    overdueCount: number;
  };
};

export async function getConciergeDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConciergeDashboardData> {
  const [contacts, tasks, appointments] = await Promise.all([
    listContacts(supabase),
    listTasks(supabase),
    listAppointments(supabase),
  ]);

  const activePatients = contacts.filter(
    (c) =>
      c.status === "ativo" &&
      (CONCIERGE_ACTIVE_STAGES as readonly string[]).includes(c.pipelineStage) &&
      (c.assignedTo === userId || c.assignedTo === null),
  );

  const pendingTasks = tasks.filter(
    (t) =>
      t.status !== "concluida" &&
      t.status !== "cancelada" &&
      activePatients.some((p) => p.id === t.contactId),
  );

  const now = new Date();
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        a.status !== "cancelado" &&
        new Date(a.startAt) >= now &&
        activePatients.some((p) => p.id === a.contactId),
    )
    .slice(0, 10);

  const overdueTasks = pendingTasks.filter(
    (t) => t.dueAt && new Date(t.dueAt) < now,
  );

  return {
    activePatients: activePatients.slice(0, 12),
    pendingTasks: pendingTasks.slice(0, 12),
    upcomingAppointments,
    metrics: {
      activeCount: activePatients.length,
      pendingTasksCount: pendingTasks.length,
      appointmentsCount: upcomingAppointments.length,
      overdueCount: overdueTasks.length,
    },
  };
}
