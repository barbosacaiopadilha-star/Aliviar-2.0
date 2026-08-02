"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { patientProfileSchema } from "./patient-schema";
import { updateCommunicationPreferences, upsertPatientProfile } from "./patient-repository";
import type { ActionResult } from "./types";

export async function updatePatientProfileAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = patientProfileSchema.safeParse({
    phone: formData.get("phone"),
    city: formData.get("city"),
    state: formData.get("state"),
    preferredChannel: formData.get("preferredChannel"),
    acceptsReminders: formData.get("acceptsReminders") === "on",
  });

  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await upsertPatientProfile(supabase, authState.user.id, {
      phone: parsed.data.phone ?? null,
      city: parsed.data.city ?? null,
      state: parsed.data.state ?? null,
    });
    await updateCommunicationPreferences(supabase, authState.user.id, {
      preferredChannel: parsed.data.preferredChannel,
      acceptsReminders: parsed.data.acceptsReminders,
    });
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-actions", erro, { mensagem: "Não foi possível salvar seu perfil agora. Tente novamente." }) };
  }

  revalidatePath("/paciente/perfil");
  return { success: true };
}
