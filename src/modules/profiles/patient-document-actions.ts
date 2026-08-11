"use server";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { validarArquivoDeDocumento } from "./document-file-policy";
import {
  deletePatientDocument,
  providePatientDocument,
  uploadPatientDocument,
} from "./patient-document-repository";
import type { ActionResult, PatientDocument } from "./types";

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
  if (!(file instanceof File)) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  // D-12.2: até aqui o writer dela aceitava qualquer arquivo com `size > 0`.
  // Por decisão do DT-01, os DOIS writers passam a validar pela mesma fonte —
  // e o risco assumido é explícito: um arquivo que ela conseguia enviar antes
  // (tipo fora da lista, acima de 20 MB, ou sem `content_type`) passa a ser
  // recusado, agora com uma frase que diz o motivo em vez de falhar adiante.
  const validacao = await validarArquivoDeDocumento(file);
  if (!validacao.aceito) {
    return { success: false, error: validacao.erro };
  }

  const supabase = await createServerSupabaseClient();

  let created;
  try {
    created = await uploadPatientDocument(supabase, authState.user.id, file, validacao.contentType);
  } catch (erro) {
    return { success: false, error: falhaParaUsuario("profiles.patient-document-actions", erro, { mensagem: "Não foi possível enviar o documento agora. Tente novamente." }) };
  }

  revalidatePath("/paciente/documentos");
  // ETAPA 9: a lista atualiza sozinha — o documento criado volta para a UI.
  return { success: true, document: created };
}

/**
 * D-12.2 · O CURADOR DISPONIBILIZA UM DOCUMENTO PARA A PACIENTE.
 *
 * A entrada é `caseId` e o arquivo — mais nada. `patient_profile_id` é
 * DERIVADO do Case aqui no servidor: aceitá-lo do formulário criaria duas
 * fontes para o mesmo fato, e a divergência entre elas seria uma porta. Quem
 * chama escolhe em qual Curadoria age, nunca para quem deposita.
 *
 * A derivação não é a autorização. Quem autoriza é a policy da D-12.1 —
 * este Case é desta paciente E o ator é o curador atribuído a ele. Ler o Case
 * antes serve só para montar o caminho e falhar cedo com uma frase melhor; a
 * recusa final é sempre do banco, nunca desta função.
 */
export async function providePatientDocumentAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult | { success: true; document: PatientDocument }> {
  let authState;
  try {
    authState = await requireRoleForAction("curador_medico");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const caseId = formData.get("caseId");
  if (typeof caseId !== "string" || caseId.trim() === "") {
    return { success: false, error: "Curadoria não informada." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  const validacao = await validarArquivoDeDocumento(file);
  if (!validacao.aceito) {
    return { success: false, error: validacao.erro };
  }

  const supabase = await createServerSupabaseClient();

  const { data: caso } = await supabase
    .from("cases")
    .select("patient_profile_id")
    .eq("id", caseId)
    .maybeSingle();

  if (!caso?.patient_profile_id) {
    return { success: false, error: "Curadoria não encontrada." };
  }

  let created;
  try {
    created = await providePatientDocument(supabase, {
      caseId,
      patientProfileId: caso.patient_profile_id as string,
      curatorId: authState.user.id,
      file,
      contentType: validacao.contentType,
    });
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.patient-document-actions", erro, {
        mensagem: "Não foi possível disponibilizar o documento agora. Tente novamente.",
      }),
    };
  }

  // A Central dela passa a mostrar o documento em "Recebidos da Aliviar".
  revalidatePath("/paciente/documentos");
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
