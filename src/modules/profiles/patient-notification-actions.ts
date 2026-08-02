"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { markPatientNotificationRead } from "./patient-notification-repository";
import type { ActionResult } from "./types";

export async function markPatientNotificationReadAction(notificationId: string): Promise<ActionResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await markPatientNotificationRead(supabase, notificationId);
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-notification-actions", erro, { mensagem: "Não foi possível atualizar a notificação agora." }) };
  }

  revalidatePath("/paciente");
  return { success: true };
}
