import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco, registrarErro } from "@/lib/observability/erros";

import { nomeDeArquivoParaCaminho } from "./document-file-policy";
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

/**
 * O upload da própria paciente. `case_id` fica ausente por construção: ela
 * não associa o próprio arquivo a uma Curadoria, e a policy da D-12.1 exige
 * `case_id is null` aqui.
 *
 * `contentType` chega já conferido contra os bytes (D-12.2) — o campo não é
 * mais preenchido com o que o cliente declarou.
 */
export async function uploadPatientDocument(
  supabase: SupabaseClient,
  profileId: string,
  file: File,
  contentType: string,
): Promise<PatientDocument> {
  const filePath = `${profileId}/${Date.now()}-${nomeDeArquivoParaCaminho(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType });

  if (uploadError) {
    throw erroDeBanco("Não foi possível enviar o arquivo.", uploadError);
  }

  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      profile_id: profileId,
      file_path: filePath,
      file_name: file.name,
      content_type: contentType,
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

/**
 * D-12.2 · O DEPÓSITO DA ALIVIAR — o Curador grava PARA a paciente.
 *
 * O que distingue este writer do de cima não é o papel de quem chama: é a
 * AUTORIA que fica gravada. `uploaded_by` é o Curador e `profile_id` é ela,
 * e é dessa desigualdade que a Central deriva "recebido da Aliviar". Nenhuma
 * coluna declara origem — a origem é fato estrutural (§C do doc 25).
 *
 * `caseId` não é enfeite: é o contexto que AUTORIZA. A policy da D-12.1 exige
 * que este Case seja desta paciente e que o ator seja o curador atribuído a
 * ele — nunca "algum Case dela".
 *
 * O caminho segue a convenção posicional que as policies leem:
 *   <dona>/received/<Case que autorizou>/<arquivo>
 *
 * `content_type` vem já CONFERIDO contra os bytes do arquivo, nunca de
 * `file.type` — ver `document-file-policy`. `file_name` guarda o nome
 * original, porque é o que ela precisa reconhecer na tela; quem é saneado é
 * só o caminho.
 */
export async function providePatientDocument(
  supabase: SupabaseClient,
  params: {
    caseId: string;
    patientProfileId: string;
    curatorId: string;
    file: File;
    contentType: string;
  },
): Promise<PatientDocument> {
  const { caseId, patientProfileId, curatorId, file, contentType } = params;

  const filePath = `${patientProfileId}/received/${caseId}/${Date.now()}-${nomeDeArquivoParaCaminho(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType });

  if (uploadError) {
    throw erroDeBanco("Não foi possível enviar o arquivo.", uploadError);
  }

  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      profile_id: patientProfileId,
      file_path: filePath,
      file_name: file.name,
      content_type: contentType,
      file_size: file.size,
      uploaded_by: curatorId,
      case_id: caseId,
    })
    .select("id, file_path, file_name, content_type, file_size, uploaded_by, created_at")
    .single();

  if (error || !data) {
    // Compensação: sem linha, o objeto seria invisível na Central e ninguém
    // mais poderia removê-lo — a paciente não tem DELETE em `received/`. A
    // policy que torna esta remoção possível concede exatamente isto e nada
    // mais: apagar objeto SEM linha. Documento efetivamente depositado tem
    // linha e continua intocável pelo depositante (não há revogação, §N).
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (storageError) {
      registrarErro("profiles.providePatientDocument.compensacaoStorage", storageError, {
        caseId,
        patientProfileId,
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
