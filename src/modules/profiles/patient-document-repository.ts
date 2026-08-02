import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco, registrarErro } from "@/lib/observability/erros";

import type { PatientDocument } from "./types";

const BUCKET = "patient-documents";

type PatientDocumentRow = {
  id: string;
  file_path: string;
  file_name: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
};

function mapRow(row: PatientDocumentRow): PatientDocument {
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

export async function listPatientDocuments(
  supabase: SupabaseClient,
  profileId: string,
): Promise<PatientDocument[]> {
  const { data, error } = await supabase
    .from("patient_documents")
    .select("id, file_path, file_name, content_type, file_size, uploaded_by, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw erroDeBanco("Não foi possível carregar os documentos.", error);
  }

  return (data as PatientDocumentRow[]).map(mapRow);
}

export async function uploadPatientDocument(
  supabase: SupabaseClient,
  profileId: string,
  file: File,
): Promise<PatientDocument> {
  const filePath = `${profileId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type || undefined });

  if (uploadError) {
    throw erroDeBanco("Não foi possível enviar o arquivo.", uploadError);
  }

  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      profile_id: profileId,
      file_path: filePath,
      file_name: file.name,
      content_type: file.type || null,
      file_size: file.size,
      uploaded_by: profileId,
    })
    .select("id, file_path, file_name, content_type, file_size, uploaded_by, created_at")
    .single();

  if (error || !data) {
    // Compensação do storage: o arquivo sem linha no banco seria invisível.
    // Se a própria remoção falhar, o resíduo é logado com referência —
    // storage e banco nunca divergem em silêncio (Bloco B/E8).
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (storageError) {
      registrarErro("profiles.uploadPatientDocument.compensacaoStorage", storageError, {
        profileId,
        filePath,
      });
    }
    throw erroDeBanco("Não foi possível registrar o documento.", error);
  }

  return mapRow(data as PatientDocumentRow);
}

export async function deletePatientDocument(
  supabase: SupabaseClient,
  documentId: string,
  profileId: string,
): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("patient_documents")
    .select("file_path, profile_id")
    .eq("id", documentId)
    .single();

  if (fetchError || !row) {
    throw new Error("Documento não encontrado.");
  }

  if (row.profile_id !== profileId) {
    throw new Error("Você não pode remover este documento.");
  }

  const { error: deleteError } = await supabase.from("patient_documents").delete().eq("id", documentId);

  if (deleteError) {
    throw erroDeBanco("Não foi possível remover o documento.", deleteError);
  }

  // A linha do banco (a fonte de visibilidade) já saiu; um arquivo que
  // sobrar no storage é resíduo — se a remoção falhar, fica logado com
  // referência, nunca uma divergência silenciosa (Bloco B/E8).
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.file_path as string]);
  if (storageError) {
    registrarErro("profiles.deletePatientDocument.storage", storageError, {
      documentId,
      filePath: row.file_path,
    });
  }
}
