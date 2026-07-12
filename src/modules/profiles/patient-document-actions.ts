"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { deletePatientDocument, uploadPatientDocument } from "./patient-document-repository";
import type { ActionResult } from "./types";

export async function uploadPatientDocumentAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
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
    await uploadPatientDocument(supabase, authState.user.id, file);
  } catch {
    return { success: false, error: "Não foi possível enviar o documento agora. Tente novamente." };
  }

  revalidatePath("/paciente/documentos");
  return { success: true };
}

export async function deletePatientDocumentAction(documentId: string): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await deletePatientDocument(supabase, documentId, authState.user.id);
  } catch {
    return { success: false, error: "Não foi possível remover o documento agora." };
  }

  revalidatePath("/paciente/documentos");
  return { success: true };
}
