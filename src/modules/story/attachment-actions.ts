"use server";

import { revalidatePath } from "next/cache";

import { falhaParaUsuario, registrarErro } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import { validarArquivoDeDocumento } from "@/modules/profiles/document-file-policy";
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
  } catch (erro) {
    // Lista vazia por exceção era invisível — o log agora diz que NÃO é vazio
    // de verdade. A UI continua funcional (sem anexos), mas a falha tem rastro.
    registrarErro("story.listarAnexos", erro, { storyId });
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
  if (!(file instanceof File)) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  // D-12.2: o anexo à história é um upload DELA, e a decisão do DT-01 vale
  // para os dois writers. A validação mora na mesma fonte da Central — dois
  // caminhos dela não podem aceitar coisas diferentes.
  const validacao = await validarArquivoDeDocumento(file);
  if (!validacao.aceito) {
    return { success: false, error: validacao.erro };
  }

  const supabase = await createServerSupabaseClient();

  // Saga documento+vínculo (Bloco B/E8, gate B16). Cada passo do repositório
  // já se compensa: `uploadPatientDocument` desfaz o storage se a linha do
  // banco falhar, e `attachDocumentToStory` desfaz o documento recém-criado
  // (linha E storage) se o vínculo for recusado — com rastro em `audit_logs`
  // quando a própria compensação falha. O sucesso só existe DEPOIS de
  // documento e vínculo confirmados; o retry reutiliza o vínculo existente e
  // o duplo clique não duplica (PK story+document).
  try {
    const document = await uploadPatientDocument(
      supabase,
      authState.user.id,
      file,
      validacao.contentType,
    );
    await attachDocumentToStory(supabase, storyId, document.id);
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("story.anexarDocumento", erro, {
        mensagem: "Não foi possível anexar o documento.",
        contexto: { storyId, arquivo: file.name },
      }),
    };
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
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("story.removerAnexo", erro, {
        mensagem: "Não foi possível remover o anexo.",
        contexto: { storyId, documentId },
      }),
    };
  }

  revalidatePath("/sua-historia/informacoes");
  return { success: true };
}
