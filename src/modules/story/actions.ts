"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { saveStoryDraft, submitStory, type SaveStoryDraftResult } from "./repository";
import { saveStoryDraftInputSchema, submitStoryInputSchema } from "./schema";
import type { PatientStory } from "./types";

export async function saveStoryDraftAction(input: unknown): Promise<SaveStoryDraftResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { outcome: "error", error: "Não autorizado." };
  }

  const parsed = saveStoryDraftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: "error", error: "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  return saveStoryDraft(
    supabase,
    parsed.data.storyId,
    parsed.data.expectedRevision,
    parsed.data.patch,
    parsed.data.currentStep,
  );
}

export type SubmitStoryActionResult =
  | { success: true; story: PatientStory }
  | { success: false; error: string };

export async function submitStoryAction(input: unknown): Promise<SubmitStoryActionResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = submitStoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const story = await submitStory(supabase, parsed.data.storyId, parsed.data.expectedRevision);
    return { success: true, story };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Não foi possível concluir agora." };
  }
}
