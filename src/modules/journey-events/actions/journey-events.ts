"use server";

import { revalidatePath } from "next/cache";
import { assertActiveStaffInAction } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import {
  correctJourneyEventSchema,
  createJourneyEventSchema,
  emptyToNull,
  toIsoDateTime,
} from "@/modules/journey-events/schemas/journey-event";

export type JourneyEventActionResult =
  | { success: true; eventId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

function extractFieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  });
  return fieldErrors;
}

export async function createJourneyEventAction(
  journeyId: string,
  _prev: JourneyEventActionResult | null,
  formData: FormData,
): Promise<JourneyEventActionResult | null> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return { success: false, error: "Perfil interno ativo obrigatório." };
  }

  const raw = {
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    journey_impact: String(formData.get("journey_impact") ?? ""),
    next_step: String(formData.get("next_step") ?? ""),
    occurred_at: String(formData.get("occurred_at") ?? ""),
    is_highlighted: formData.get("is_highlighted"),
  };

  const parsed = createJourneyEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Verifique os campos destacados.",
      fieldErrors: extractFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: eventId, error } = await supabase.rpc("create_journey_event", {
    p_journey_id: journeyId,
    p_category: data.category,
    p_title: data.title,
    p_description: emptyToNull(data.description),
    p_journey_impact: emptyToNull(data.journey_impact),
    p_next_step: emptyToNull(data.next_step),
    p_occurred_at: toIsoDateTime(data.occurred_at),
    p_is_highlighted: data.is_highlighted ?? false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/journeys/${journeyId}`);

  return { success: true, eventId: eventId as string };
}

export async function correctJourneyEventAction(
  journeyId: string,
  _prev: JourneyEventActionResult | null,
  formData: FormData,
): Promise<JourneyEventActionResult | null> {
  try {
    await assertActiveStaffInAction();
  } catch {
    return { success: false, error: "Perfil interno ativo obrigatório." };
  }

  const raw = {
    original_event_id: String(formData.get("original_event_id") ?? ""),
    correction_reason: String(formData.get("correction_reason") ?? ""),
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    journey_impact: String(formData.get("journey_impact") ?? ""),
    next_step: String(formData.get("next_step") ?? ""),
    occurred_at: String(formData.get("occurred_at") ?? ""),
    is_highlighted: formData.get("is_highlighted"),
  };

  const parsed = correctJourneyEventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Verifique os campos destacados.",
      fieldErrors: extractFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: eventId, error } = await supabase.rpc("correct_journey_event", {
    p_original_event_id: data.original_event_id,
    p_correction_reason: data.correction_reason,
    p_category: data.category,
    p_title: data.title,
    p_description: emptyToNull(data.description),
    p_journey_impact: emptyToNull(data.journey_impact),
    p_next_step: emptyToNull(data.next_step),
    p_occurred_at: toIsoDateTime(data.occurred_at),
    p_is_highlighted: data.is_highlighted ?? false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/journeys/${journeyId}`);

  return { success: true, eventId: eventId as string };
}
