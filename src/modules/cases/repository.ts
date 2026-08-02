import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import { isValidCaseTransition } from "./state-machine";
import type {
  CaseDetail,
  CaseEvent,
  CaseEventType,
  CaseNote,
  CaseStatus,
  CaseSummary,
  PatientCaseOverview,
} from "./types";
import { CASE_STATUS_LABELS } from "./types";

const CASE_COLUMNS =
  "id, patient_profile_id, source_story_id, status, current_stage, assigned_curator_id, created_by, created_at, updated_at, started_at, closed_at, method_version";

type CaseRow = {
  id: string;
  patient_profile_id: string;
  source_story_id: string;
  status: CaseStatus;
  current_stage: string | null;
  assigned_curator_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  closed_at: string | null;
  method_version: string | null;
};

async function namesByProfileIds(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(profileIds));
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, display_name").in("id", uniqueIds);
  return new Map((data ?? []).map((row) => [row.id as string, (row.display_name as string | null) ?? "Sem nome"]));
}

function mapSummary(row: CaseRow, names: Map<string, string>): CaseSummary {
  return {
    id: row.id,
    patientProfileId: row.patient_profile_id,
    patientName: names.get(row.patient_profile_id) ?? "Sem nome",
    sourceStoryId: row.source_story_id,
    status: row.status,
    assignedCuratorId: row.assigned_curator_id,
    assignedCuratorName: row.assigned_curator_id ? (names.get(row.assigned_curator_id) ?? "Sem nome") : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDetail(row: CaseRow, names: Map<string, string>): CaseDetail {
  return {
    ...mapSummary(row, names),
    currentStage: row.current_stage,
    methodVersion: row.method_version,
    createdBy: row.created_by,
    startedAt: row.started_at,
    closedAt: row.closed_at,
  };
}

// Lista os Casos visíveis para quem está chamando — a RLS já resolve o
// recorte (administrador vê todos; curador médico só os atribuídos a ele);
// busca/filtro/paginação são responsabilidade da UI (client-side, mesmo
// padrão de admin/pacientes e admin/profissionais).
export async function listCases(supabase: SupabaseClient): Promise<CaseSummary[]> {
  const { data, error } = await supabase
    .from("cases")
    .select(CASE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar os casos.", error);
  }

  const rows = data as CaseRow[];
  const names = await namesByProfileIds(
    supabase,
    rows.flatMap((row) => [row.patient_profile_id, row.assigned_curator_id].filter((id): id is string => Boolean(id))),
  );

  return rows.map((row) => mapSummary(row, names));
}

// Usado para decidir, na tela de um paciente, se uma história já tem um
// Caso (ativo ou não) — evita oferecer "Iniciar Caso" para uma história que
// já tem um.
export async function getCaseByStoryId(supabase: SupabaseClient, storyId: string): Promise<CaseSummary | null> {
  const { data, error } = await supabase
    .from("cases")
    .select(CASE_COLUMNS)
    .eq("source_story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as CaseRow;
  const names = await namesByProfileIds(
    supabase,
    [row.patient_profile_id, row.assigned_curator_id].filter((id): id is string => Boolean(id)),
  );

  return mapSummary(row, names);
}

export async function getCase(supabase: SupabaseClient, caseId: string): Promise<CaseDetail | null> {
  const { data, error } = await supabase.from("cases").select(CASE_COLUMNS).eq("id", caseId).maybeSingle();

  if (error) {
    throw erroDeBanco("Não foi possível carregar o caso.", error);
  }

  if (!data) return null;

  const row = data as CaseRow;
  const names = await namesByProfileIds(
    supabase,
    [row.patient_profile_id, row.assigned_curator_id].filter((id): id is string => Boolean(id)),
  );

  return mapDetail(row, names);
}

/**
 * A história que originou o Caso, nas palavras do paciente (ETAPA 8).
 * Leitura de referência para o Acolhimento — o Curador nunca redigita a
 * história; ele a lê e consolida apenas o Caso Clínico.
 */
export async function getSourceStoryText(
  supabase: SupabaseClient,
  caseId: string,
): Promise<{ historia: string | null; motivo: string | null } | null> {
  const { data: caso } = await supabase
    .from("cases")
    .select("source_story_id")
    .eq("id", caseId)
    .maybeSingle();
  if (!caso?.source_story_id) return null;

  const { data: story } = await supabase
    .from("patient_stories")
    .select("data")
    .eq("id", caso.source_story_id as string)
    .maybeSingle();
  if (!story) return null;

  const dados = (story.data ?? {}) as { historia?: string; motivo?: string };
  return { historia: dados.historia ?? null, motivo: dados.motivo ?? null };
}

export async function createCase(
  supabase: SupabaseClient,
  storyId: string,
  assignedCuratorId: string | undefined,
  createdBy: string,
): Promise<CaseDetail> {
  const { data: story, error: storyError } = await supabase
    .from("patient_stories")
    .select("id, profile_id, status")
    .eq("id", storyId)
    .single();

  if (storyError || !story) {
    throw new Error("História não encontrada.");
  }

  if (story.status !== "enviada") {
    throw new Error("Só é possível iniciar um Caso a partir de uma história já enviada.");
  }

  const { data: existingActive } = await supabase
    .from("cases")
    .select("id")
    .eq("source_story_id", storyId)
    .not("status", "in", "(CLOSED,CANCELLED)")
    .maybeSingle();

  if (existingActive) {
    throw new Error("Já existe um Caso ativo para esta história.");
  }

  const { data: created, error } = await supabase
    .from("cases")
    .insert({
      patient_profile_id: story.profile_id,
      source_story_id: storyId,
      assigned_curator_id: assignedCuratorId ?? null,
      created_by: createdBy,
    })
    .select(CASE_COLUMNS)
    .single();

  if (error || !created) {
    throw erroDeBanco("Não foi possível criar o caso agora.", error);
  }

  const row = created as CaseRow;

  await supabase.from("case_events").insert({
    case_id: row.id,
    event_type: "created" as CaseEventType,
    actor_id: createdBy,
    to_value: row.status,
  });

  if (assignedCuratorId) {
    await supabase.from("case_events").insert({
      case_id: row.id,
      event_type: "curator_assigned" as CaseEventType,
      actor_id: createdBy,
      from_value: null,
      to_value: assignedCuratorId,
    });
  }

  const names = await namesByProfileIds(supabase, [row.patient_profile_id, assignedCuratorId].filter(Boolean) as string[]);
  return mapDetail(row, names);
}

export async function reassignCurator(
  supabase: SupabaseClient,
  caseId: string,
  newCuratorId: string | null,
  changedBy: string,
  reason: string | undefined,
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from("cases")
    .select("assigned_curator_id")
    .eq("id", caseId)
    .single();

  if (fetchError || !current) {
    throw new Error("Caso não encontrado.");
  }

  const { error } = await supabase.from("cases").update({ assigned_curator_id: newCuratorId }).eq("id", caseId);

  if (error) {
    throw erroDeBanco("Não foi possível reatribuir o caso agora.", error);
  }

  await supabase.from("case_events").insert({
    case_id: caseId,
    event_type: "curator_assigned" as CaseEventType,
    actor_id: changedBy,
    from_value: current.assigned_curator_id,
    to_value: newCuratorId,
    reason: reason ?? null,
  });
}

export async function changeCaseStatus(
  supabase: SupabaseClient,
  caseId: string,
  nextStatus: CaseStatus,
  actorId: string,
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .single();

  if (fetchError || !current) {
    throw new Error("Caso não encontrado.");
  }

  const currentStatus = current.status as CaseStatus;

  if (!isValidCaseTransition(currentStatus, nextStatus)) {
    throw new Error(`Não é possível mudar o status de ${currentStatus} para ${nextStatus}.`);
  }

  const { error } = await supabase.from("cases").update({ status: nextStatus }).eq("id", caseId);

  if (error) {
    throw erroDeBanco("Não foi possível mudar o status agora.", error);
  }

  await supabase.from("case_events").insert({
    case_id: caseId,
    event_type: "status_changed" as CaseEventType,
    actor_id: actorId,
    from_value: currentStatus,
    to_value: nextStatus,
  });
}

// Append-only (ajuste pós-Sprint 2) — cada chamada cria uma nota nova,
// nunca edita ou apaga uma anterior (garantido também por RLS: não existe
// policy de UPDATE/DELETE em case_notes).
export async function addCaseNote(
  supabase: SupabaseClient,
  caseId: string,
  body: string,
  authorId: string,
): Promise<CaseNote> {
  const { data, error } = await supabase
    .from("case_notes")
    .insert({ case_id: caseId, author_id: authorId, body })
    .select("id, case_id, author_id, body, created_at")
    .single();

  if (error || !data) {
    throw erroDeBanco("Não foi possível salvar a nota agora.", error);
  }

  const names = await namesByProfileIds(supabase, [authorId]);

  return {
    id: data.id as number,
    caseId: data.case_id as string,
    authorId: data.author_id as string,
    authorName: names.get(authorId) ?? "Sem nome",
    body: data.body as string,
    createdAt: data.created_at as string,
  };
}

type CaseNoteRow = {
  id: number;
  case_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export async function listCaseNotes(supabase: SupabaseClient, caseId: string): Promise<CaseNote[]> {
  const { data, error } = await supabase
    .from("case_notes")
    .select("id, case_id, author_id, body, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar as notas do caso.", error);
  }

  const rows = data as CaseNoteRow[];
  const names = await namesByProfileIds(supabase, rows.map((row) => row.author_id));

  return rows.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    authorId: row.author_id,
    authorName: names.get(row.author_id) ?? "Sem nome",
    body: row.body,
    createdAt: row.created_at,
  }));
}

type CaseEventRow = {
  id: number;
  case_id: string;
  event_type: CaseEventType;
  actor_id: string | null;
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
  created_at: string;
};

export async function listCaseEvents(supabase: SupabaseClient, caseId: string): Promise<CaseEvent[]> {
  const { data, error } = await supabase
    .from("case_events")
    .select("id, case_id, event_type, actor_id, from_value, to_value, reason, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar o histórico do caso.", error);
  }

  const rows = data as CaseEventRow[];

  const profileIdsToResolve = rows.flatMap((row) => {
    const ids = [row.actor_id].filter((id): id is string => Boolean(id));
    if (row.event_type === "curator_assigned") {
      ids.push(...[row.from_value, row.to_value].filter((id): id is string => Boolean(id)));
    }
    return ids;
  });

  const names = await namesByProfileIds(supabase, profileIdsToResolve);

  function resolveLabel(eventType: CaseEventType, value: string | null): string | null {
    if (!value) return null;
    if (eventType === "status_changed") return CASE_STATUS_LABELS[value as CaseStatus] ?? value;
    if (eventType === "curator_assigned") return names.get(value) ?? "Sem nome";
    return value;
  }

  return rows.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? "Sem nome") : null,
    fromValue: row.from_value,
    toValue: row.to_value,
    fromLabel: resolveLabel(row.event_type, row.from_value),
    toLabel: resolveLabel(row.event_type, row.to_value),
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function getPatientCaseOverview(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientCaseOverview | null> {
  const { data, error } = await supabase
    .from("patient_case_overview")
    .select("case_id, status_label, updated_at")
    .eq("patient_profile_id", profileId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    caseId: data.case_id as string,
    statusLabel: data.status_label as string,
    updatedAt: data.updated_at as string,
  };
}
