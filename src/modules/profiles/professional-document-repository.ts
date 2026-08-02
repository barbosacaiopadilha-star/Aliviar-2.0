import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco } from "@/lib/observability/erros";

import type { ProfessionalDocument } from "./types";

const BUCKET = "professional-documents";

type ProfessionalDocumentRow = {
  id: string;
  file_path: string;
  file_name: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
};

function mapRow(row: ProfessionalDocumentRow): ProfessionalDocument {
  return {
    id: row.id,
    filePath: row.file_path,
    fileName: row.file_name,
    contentType: row.content_type,
    fileSize: row.file_size,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export async function listProfessionalDocuments(
  supabase: SupabaseClient,
  professionalProfileId: string,
): Promise<ProfessionalDocument[]> {
  const { data, error } = await supabase
    .from("professional_documents")
    .select("id, file_path, file_name, content_type, file_size, uploaded_by, created_at")
    .eq("professional_profile_id", professionalProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar os documentos.", error);
  }

  return (data as ProfessionalDocumentRow[]).map(mapRow);
}

// Envia o arquivo ao bucket privado e registra os metadados em uma única
// operação; se o registro de metadados falhar, remove o arquivo já enviado
// para nunca deixar um objeto de storage órfão sem linha correspondente.
export async function uploadProfessionalDocument(
  supabase: SupabaseClient,
  professionalProfileId: string,
  file: File,
  uploadedBy: string,
): Promise<ProfessionalDocument> {
  const filePath = `${professionalProfileId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    throw erroDeBanco("Não foi possível enviar o arquivo.", uploadError);
  }

  const { data, error } = await supabase
    .from("professional_documents")
    .insert({
      professional_profile_id: professionalProfileId,
      file_path: filePath,
      file_name: file.name,
      content_type: file.type || null,
      file_size: file.size,
      uploaded_by: uploadedBy,
    })
    .select("id, file_path, file_name, content_type, file_size, uploaded_by, created_at")
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw erroDeBanco("Não foi possível registrar o documento.", error);
  }

  return mapRow(data as ProfessionalDocumentRow);
}

export async function deleteProfessionalDocument(supabase: SupabaseClient, documentId: string): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("professional_documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (fetchError || !row) {
    throw new Error("Documento não encontrado.");
  }

  const { error: deleteError } = await supabase.from("professional_documents").delete().eq("id", documentId);

  if (deleteError) {
    throw erroDeBanco("Não foi possível remover o documento.", deleteError);
  }

  await supabase.storage.from(BUCKET).remove([row.file_path as string]);
}
