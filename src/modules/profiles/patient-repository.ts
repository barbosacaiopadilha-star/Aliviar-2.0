import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import {
  DEFAULT_COMMUNICATION_PREFERENCES,
  type CommunicationPreferences,
  type PatientProfile,
} from "./types";

type PatientProfileRow = {
  profile_id: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS = "profile_id, phone, city, state, status, created_at, updated_at";

function mapRow(row: PatientProfileRow): PatientProfile {
  return {
    profileId: row.profile_id,
    phone: row.phone,
    city: row.city,
    state: row.state,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPatientProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from("patient_profiles")
    .select(SELECT_COLUMNS)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw erroDeBanco("Não foi possível carregar o perfil do paciente.", error);
  }

  return data ? mapRow(data as PatientProfileRow) : null;
}

export type UpsertPatientProfileInput = {
  phone: string | null;
  city: string | null;
  state: string | null;
};

// Faz o papel de "criação automática ou inicialização" do perfil (Sprint
// Produto 2): não há linha em patient_profiles até o primeiro salvamento —
// o upsert cobre criação e atualização em uma única operação idempotente.
export async function upsertPatientProfile(
  supabase: SupabaseClient,
  profileId: string,
  input: UpsertPatientProfileInput,
): Promise<PatientProfile> {
  const { data, error } = await supabase
    .from("patient_profiles")
    .upsert(
      {
        profile_id: profileId,
        phone: input.phone,
        city: input.city,
        state: input.state,
      },
      { onConflict: "profile_id" },
    )
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw erroDeBanco("Não foi possível salvar o perfil do paciente.", error);
  }

  return mapRow(data as PatientProfileRow);
}

// Preferências de comunicação vivem em user_settings.preferences (jsonb já
// existente, TASK-003) — nunca em coluna própria (ADR-014-style: evitar
// migração estrutural para uma preferência de UI ainda não fechada).
export async function getCommunicationPreferences(
  supabase: SupabaseClient,
  profileId: string,
): Promise<CommunicationPreferences> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("preferences")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_COMMUNICATION_PREFERENCES;
  }

  const preferences = data.preferences as Partial<CommunicationPreferences> | null;
  return {
    preferredChannel: preferences?.preferredChannel ?? DEFAULT_COMMUNICATION_PREFERENCES.preferredChannel,
    acceptsReminders: preferences?.acceptsReminders ?? DEFAULT_COMMUNICATION_PREFERENCES.acceptsReminders,
  };
}

export async function updateCommunicationPreferences(
  supabase: SupabaseClient,
  profileId: string,
  preferences: CommunicationPreferences,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ preferences })
    .eq("profile_id", profileId);

  if (error) {
    throw erroDeBanco("Não foi possível salvar as preferências de comunicação.", error);
  }
}
