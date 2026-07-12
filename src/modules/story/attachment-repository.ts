import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type StoryAttachment = {
  documentId: string;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
};

type AttachmentRow = {
  document_id: string;
  created_at: string;
  patient_documents:
    | { file_name: string; file_size: number | null }
    | { file_name: string; file_size: number | null }[]
    | null;
};

function extractDocument(
  value: AttachmentRow["patient_documents"],
): { file_name: string; file_size: number | null } | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listStoryAttachments(
  supabase: SupabaseClient,
  storyId: string,
): Promise<StoryAttachment[]> {
  const { data, error } = await supabase
    .from("patient_story_attachments")
    .select("document_id, created_at, patient_documents(file_name, file_size)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar os anexos.");
  }

  return (data as AttachmentRow[]).map((row) => {
    const document = extractDocument(row.patient_documents);
    return {
      documentId: row.document_id,
      fileName: document?.file_name ?? "",
      fileSize: document?.file_size ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function attachDocumentToStory(
  supabase: SupabaseClient,
  storyId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("patient_story_attachments")
    .insert({ story_id: storyId, document_id: documentId });

  if (error) {
    throw new Error("Não foi possível anexar o documento.");
  }
}

export async function detachDocumentFromStory(
  supabase: SupabaseClient,
  storyId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("patient_story_attachments")
    .delete()
    .eq("story_id", storyId)
    .eq("document_id", documentId);

  if (error) {
    throw new Error("Não foi possível remover o anexo.");
  }
}
