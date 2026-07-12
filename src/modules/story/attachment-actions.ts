"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import { uploadPatientDocument } from "@/modules/profiles/patient-document-repository";

import { attachDocumentToStory, detachDocumentFromStory, listStoryAttachments, type StoryAttachment } from "./attachment-repository";
import type { StoryActionResult } from "./types";

export async function listStoryAttachmentsAction(storyId: string): Promise<StoryAttachment[]> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return [];
  }

  const supabase = await createServerSupabaseClient();

  try {
    return await listStoryAttachments(supabase, storyId);
  } catch {
    return [];
  }
}

export async function uploadAndAttachStoryDocumentAction(
  storyId: string,
  _prevState: StoryActionResult | undefined,
  formData: FormData,
): Promise<StoryActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const document = await uploadPatientDocument(supabase, authState.user.id, file);
    await attachDocumentToStory(supabase, storyId, document.id);
  } catch {
    return { success: false, error: "Não foi possível anexar o documento agora. Tente novamente." };
  }

  revalidatePath("/sua-historia/informacoes");
  return { success: true };
}

export async function detachStoryDocumentAction(storyId: string, documentId: string): Promise<StoryActionResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await detachDocumentFromStory(supabase, storyId, documentId);
  } catch {
    return { success: false, error: "Não foi possível remover o anexo agora." };
  }

  revalidatePath("/sua-historia/informacoes");
  return { success: true };
}
