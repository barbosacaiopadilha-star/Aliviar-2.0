import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { PatientNotification } from "./types";

type PatientNotificationRow = {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function mapRow(row: PatientNotificationRow): PatientNotification {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function listPatientNotifications(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientNotification[]> {
  const { data, error } = await supabase
    .from("patient_notifications")
    .select("id, profile_id, title, body, created_at, read_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar as notificações.");
  }

  return (data as PatientNotificationRow[]).map(mapRow);
}

export async function markPatientNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("patient_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    throw new Error("Não foi possível atualizar a notificação.");
  }
}

// Chamado a partir de ações administrativas já existentes
// (patient-account-actions.ts) depois de um evento real acontecer — nunca
// cria notificação especulativa ou fictícia.
export async function createPatientNotification(
  supabase: SupabaseClient,
  profileId: string,
  title: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from("patient_notifications").insert({
    profile_id: profileId,
    title,
    body,
  });

  if (error) {
    throw new Error("Não foi possível registrar a notificação.");
  }
}
