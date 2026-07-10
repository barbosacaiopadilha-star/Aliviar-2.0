"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertActiveStaffInAction } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import {
  createPatientWithJourneySchema,
  emptyToNull,
  parsePriority,
} from "@/lib/validations/patient-journey";

export type ActionResult =
  | { success: true; journeyId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function formDataToObject(formData: FormData): Record<string, string> {
  return {
    full_name: String(formData.get("full_name") ?? ""),
    preferred_name: String(formData.get("preferred_name") ?? ""),
    birth_date: String(formData.get("birth_date") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    health_plan: String(formData.get("health_plan") ?? ""),
    title: String(formData.get("title") ?? ""),
    objective: String(formData.get("objective") ?? ""),
    manager_id: String(formData.get("manager_id") ?? ""),
    priority: String(formData.get("priority") ?? "NORMAL"),
    opened_at: String(formData.get("opened_at") ?? ""),
  };
}

export async function createPatientWithJourneyAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult | null> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return { success: false, error: "Perfil interno ativo obrigatório." };
  }

  const raw = formDataToObject(formData);
  const parsed = createPatientWithJourneySchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    });
    return {
      success: false,
      error: "Verifique os campos destacados.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("create_patient_with_initial_journey", {
    p_full_name: data.full_name,
    p_preferred_name: emptyToNull(data.preferred_name),
    p_birth_date: emptyToNull(data.birth_date),
    p_cpf: emptyToNull(data.cpf),
    p_phone: emptyToNull(data.phone),
    p_email: emptyToNull(data.email),
    p_city: emptyToNull(data.city),
    p_state: emptyToNull(data.state),
    p_health_plan: emptyToNull(data.health_plan),
    p_journey_title: data.title,
    p_journey_objective: emptyToNull(data.objective),
    p_manager_id: data.manager_id,
    p_journey_priority: parsePriority(data.priority),
    p_opened_at: emptyToNull(data.opened_at),
  });

  if (error) {
    return {
      success: false,
      error: error.message.includes("Gestor inválido")
        ? "Selecione um Gestor ativo (ADMIN ou MANAGER)."
        : error.message,
    };
  }

  const row = Array.isArray(result) ? result[0] : result;
  const journeyId = row?.journey_id as string | undefined;

  if (!journeyId) {
    return {
      success: false,
      error: "Não foi possível concluir o cadastro. A Jornada inicial não foi criada.",
    };
  }

  revalidatePath("/workspace");
  revalidatePath("/patients");
  revalidatePath("/journeys");

  redirect(`/journeys/${journeyId}`);
}

export async function createJourneyForPatientAction(formData: FormData): Promise<void> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return;
  }

  const patientId = String(formData.get("patient_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const objective = emptyToNull(String(formData.get("objective") ?? ""));
  const managerId = String(formData.get("manager_id") ?? "");
  const priority = parsePriority(String(formData.get("priority") ?? "NORMAL"));
  const openedAt = emptyToNull(String(formData.get("opened_at") ?? ""));

  if (!patientId || !title || !managerId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data, error } = await supabase
    .from("journeys")
    .insert({
      patient_id: patientId,
      title,
      objective,
      manager_id: managerId,
      priority,
      opened_at: openedAt ?? new Date().toISOString().slice(0, 10),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return;
  }

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/journeys");
  revalidatePath("/workspace");

  redirect(`/journeys/${data.id}`);
}
