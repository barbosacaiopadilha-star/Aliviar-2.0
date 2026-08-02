"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { deletePatientDocument, uploadPatientDocument } from "./patient-document-repository";
import type { ActionResult } from "./types";

export async function uploadPatientDocumentAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | { success: true; document: import("./types").PatientDocument }> {
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

  let created;
  try {
    created = await uploadPatientDocument(supabase, authState.user.id, file);
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-document-actions", erro, { mensagem: "Não foi possível enviar o documento agora. Tente novamente." }) };
  }

  revalidatePath("/paciente/documentos");
  // ETAPA 9: a lista atualiza sozinha — o documento criado volta para a UI.
  return { success: true, document: created };
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
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-document-actions", erro, { mensagem: "Não foi possível remover o documento agora." }) };
  }

  revalidatePath("/paciente/documentos");
  return { success: true };
}
