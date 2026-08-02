"use server";

import { revalidatePath } from "next/cache";

import { falhaParaUsuario, registrarErro } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import {
  deletePatientDocument,
  uploadPatientDocument,
} from "@/modules/profiles/patient-document-repository";

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
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Selecione um arquivo para enviar." };
  }

  const supabase = await createServerSupabaseClient();

  // Compensação explícita (Release de Reconstrução, ETAPA 9).
  //
  // São três escritas em sistemas diferentes — storage, `patient_documents` e
  // `patient_story_attachments` — e não há transação que as cubra. Antes,
  // quando o vínculo falhava (foi o caso da recursão de policy 42P17), o
  // documento ficava criado e órfão: existia no banco, não aparecia em lugar
  // nenhum, e ninguém sabia que estava lá. Se o vínculo falhar, o que foi
  // criado aqui é desfeito.
  let documentId: string | null = null;
  try {
    const document = await uploadPatientDocument(supabase, authState.user.id, file);
    documentId = document.id;
    await attachDocumentToStory(supabase, storyId, document.id);
  } catch (erro) {
    if (documentId) {
      try {
        await deletePatientDocument(supabase, documentId, authState.user.id);
      } catch (erroDaCompensacao) {
        // A compensação falhou: aí existe mesmo um órfão, e isso precisa ser
        // dito no log — silenciar seria perder a única pista de que ele existe.
        registrarErro("story.anexarDocumento.compensacao", erroDaCompensacao, {
          storyId,
          documentId,
          observacao: "documento criado sem vínculo e não removido",
        });
      }
    }

    return {
      success: false,
      error: falhaParaUsuario("story.anexarDocumento", erro, {
        mensagem: "Não foi possível anexar o documento.",
        contexto: { storyId, arquivo: file.name, documentoRevertido: Boolean(documentId) },
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
