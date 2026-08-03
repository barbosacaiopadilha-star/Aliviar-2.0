import "server-only";
import { erroDeBanco, falhaParaUsuario } from "@/lib/observability/erros";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PatientStory, StoryStep, SuaHistoriaData } from "./types";

const SELECT_COLUMNS = "id, status, current_step, data, revision, submitted_at, created_at, updated_at";

type PatientStoryRow = {
  id: string;
  status: "rascunho" | "enviada";
  current_step: string;
  data: SuaHistoriaData;
  revision: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: PatientStoryRow): PatientStory {
  return {
    id: row.id,
    status: row.status,
    currentStep: row.current_step as StoryStep,
    data: row.data ?? {},
    revision: row.revision,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Retoma a história em rascunho mais recente do paciente, ou cria uma nova
// se não houver nenhuma — nunca cria uma segunda história em rascunho
// enquanto uma já existir (preparação para múltiplas histórias futuras:
// uma nova só nasce depois que a anterior for "enviada").
/**
 * A história que "Minha história" deve abrir: o rascunho em andamento se
 * houver, senão a última enviada.
 *
 * Existe porque `getOrCreateActiveStory` procura apenas rascunho — e, depois
 * que a pessoa envia, ela deixa de ter rascunho. Navegar de volta criava uma
 * história NOVA e em branco, e a que ela acabara de contar sumia da vista.
 * Uma segunda história é um ato deliberado, nunca efeito colateral de clicar
 * num link do menu.
 */
export async function getLatestStory(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientStory | null> {
  const { data, error } = await supabase
    .from("patient_stories")
    .select(SELECT_COLUMNS)
    .eq("profile_id", profileId)
    // Rascunho primeiro ('rascunho' > 'enviada' na ordem do texto); entre
    // iguais, a mais recente.
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw erroDeBanco("Não foi possível carregar sua história.", error);
  return data ? mapRow(data as PatientStoryRow) : null;
}

export async function getOrCreateActiveStory(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientStory> {
  const { data: existing, error: fetchError } = await supabase
    .from("patient_stories")
    .select(SELECT_COLUMNS)
    .eq("profile_id", profileId)
    .eq("status", "rascunho")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw erroDeBanco("Não foi possível carregar sua história.", fetchError);
  }

  if (existing) {
    return mapRow(existing as PatientStoryRow);
  }

  const { data: created, error: createError } = await supabase
    .from("patient_stories")
    .insert({ profile_id: profileId, created_by: profileId })
    .select(SELECT_COLUMNS)
    .single();

  // Corrida perdida (23505 no índice `um_rascunho_por_paciente`): outra
  // requisição criou o rascunho entre a nossa leitura e a nossa escrita. Isso
  // não é erro para quem está do outro lado da tela — é a mesma história que
  // ela pediu. Relê e devolve, em vez de anunciar uma falha inexistente.
  if (createError && (createError as { code?: string }).code === "23505") {
    const { data: concorrente } = await supabase
      .from("patient_stories")
      .select(SELECT_COLUMNS)
      .eq("profile_id", profileId)
      .eq("status", "rascunho")
      .maybeSingle();

    if (concorrente) return mapRow(concorrente as PatientStoryRow);
  }

  if (createError || !created) {
    throw erroDeBanco("Não foi possível iniciar sua história.", createError);
  }

  return mapRow(created as PatientStoryRow);
}

// Leitura direta por id — usada pela equipe Aliviar (administrador/curador
// médico) ao abrir um Caso (ÉPICO 1/SPRINT 2); RLS decide se quem chama tem
// direito a ver esta linha (dono, administrador, ou curador atribuído ao
// Caso originado dela — migration 20260712100010).
export async function getStoryById(supabase: SupabaseClient, storyId: string): Promise<PatientStory | null> {
  const { data, error } = await supabase.from("patient_stories").select(SELECT_COLUMNS).eq("id", storyId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as PatientStoryRow);
}

// Lista todas as histórias (rascunho ou enviada) de um paciente — usada
// pela equipe Aliviar para decidir se um Caso pode ser iniciado
// (ÉPICO 1/SPRINT 2). RLS restringe a quem tem direito de ver.
export async function listStoriesForProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientStory[]> {
  const { data, error } = await supabase
    .from("patient_stories")
    .select(SELECT_COLUMNS)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar as histórias.", error);
  }

  return (data as PatientStoryRow[]).map(mapRow);
}

export type SaveStoryDraftResult =
  | { outcome: "saved"; story: PatientStory }
  | { outcome: "conflict"; story: PatientStory }
  | { outcome: "error"; error: string };

// Concorrência otimista: só grava se `expectedRevision` ainda for a
// revision atual da linha — nunca sobrescreve silenciosamente uma edição
// mais recente vinda de outra aba/dispositivo (ADR-018).
export async function saveStoryDraft(
  supabase: SupabaseClient,
  storyId: string,
  expectedRevision: number,
  patch: Partial<SuaHistoriaData>,
  currentStep: StoryStep,
): Promise<SaveStoryDraftResult> {
  const { data: currentRow, error: fetchError } = await supabase
    .from("patient_stories")
    .select("data, revision, status")
    .eq("id", storyId)
    .single();

  // Bloco D: erro de infraestrutura ganha rastro + referência (a causa vai
  // inteira ao log estruturado); a frase à pessoa continua digna. `single()`
  // sem linha também chega como error — a mensagem cobre os dois casos.
  if (fetchError || !currentRow) {
    return {
      outcome: "error",
      error: falhaParaUsuario(
        "story.saveDraft.leitura",
        erroDeBanco("Não foi possível salvar agora.", fetchError, { storyId }),
        { mensagem: "Não foi possível salvar agora." },
      ),
    };
  }

  if (currentRow.status === "enviada") {
    return { outcome: "error", error: "Esta história já foi enviada e não pode mais ser editada." };
  }

  const mergedData = { ...(currentRow.data as SuaHistoriaData), ...patch };

  const { data: updated, error } = await supabase
    .from("patient_stories")
    .update({ data: mergedData, current_step: currentStep })
    .eq("id", storyId)
    .eq("revision", expectedRevision)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    return {
      outcome: "error",
      error: falhaParaUsuario(
        "story.saveDraft.gravacao",
        erroDeBanco("Não foi possível salvar agora.", error, { storyId, expectedRevision }),
        { mensagem: "Não foi possível salvar agora." },
      ),
    };
  }

  if (!updated) {
    const { data: latest, error: latestError } = await supabase
      .from("patient_stories")
      .select(SELECT_COLUMNS)
      .eq("id", storyId)
      .single();

    if (latestError || !latest) {
      return {
        outcome: "error",
        error: falhaParaUsuario(
          "story.saveDraft.releitura",
          erroDeBanco("Não foi possível salvar agora.", latestError, { storyId }),
          { mensagem: "Não foi possível salvar agora." },
        ),
      };
    }

    return { outcome: "conflict", story: mapRow(latest as PatientStoryRow) };
  }

  return { outcome: "saved", story: mapRow(updated as PatientStoryRow) };
}

export async function submitStory(
  supabase: SupabaseClient,
  storyId: string,
  expectedRevision: number,
): Promise<PatientStory> {
  const { data: updated, error } = await supabase
    .from("patient_stories")
    .update({ status: "enviada" })
    .eq("id", storyId)
    .eq("revision", expectedRevision)
    .eq("status", "rascunho")
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw erroDeBanco("Não foi possível concluir sua história agora.", error);
  }

  if (!updated) {
    throw new Error("Sua história foi atualizada em outro lugar. Atualize a página e tente novamente.");
  }

  return mapRow(updated as PatientStoryRow);
}

export type PatientStoryVersion = {
  id: string;
  revision: number;
  data: SuaHistoriaData;
  currentStep: string;
  status: "rascunho" | "enviada";
  createdAt: string;
};

export async function listStoryVersions(
  supabase: SupabaseClient,
  storyId: string,
): Promise<PatientStoryVersion[]> {
  const { data, error } = await supabase
    .from("patient_story_versions")
    .select("id, revision, data, current_step, status, created_at")
    .eq("story_id", storyId)
    .order("revision", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar o histórico de versões.", error);
  }

  return (
    data as Array<{
      id: string;
      revision: number;
      data: SuaHistoriaData;
      current_step: string;
      status: "rascunho" | "enviada";
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    revision: row.revision,
    data: row.data,
    currentStep: row.current_step,
    status: row.status,
    createdAt: row.created_at,
  }));
}
