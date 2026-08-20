"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { deleteProfessionalDocument, uploadProfessionalDocument } from "./professional-document-repository";
import type { ActionResult } from "./types";

export async function uploadProfessionalDocumentAction(
  professionalProfileId: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await uploadProfessionalDocument(supabase, professionalProfileId, file, authState.user.id);
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.professional-document-actions", erro, { mensagem: "Não foi possível enviar o documento agora. Tente novamente." }) };
  }

  revalidatePath(`/admin/profissionais/${professionalProfileId}`, "layout");
  return { success: true };
}

export async function deleteProfessionalDocumentAction(
  professionalProfileId: string,
  documentId: string,
): Promise<ActionResult> {
  try {
    await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await deleteProfessionalDocument(supabase, documentId);
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.professional-document-actions", erro, { mensagem: "Não foi possível remover o documento agora." }) };
  }

  revalidatePath(`/admin/profissionais/${professionalProfileId}`, "layout");
  return { success: true };
}
