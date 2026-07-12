"use server";

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
  } catch {
    return { success: false, error: "Não foi possível atualizar a notificação agora." };
  }

  revalidatePath("/paciente");
  return { success: true };
}
