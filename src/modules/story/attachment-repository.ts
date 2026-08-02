import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { erroDeBanco, registrarErro } from "@/lib/observability/erros";
import { deletePatientDocument } from "@/modules/profiles/patient-document-repository";

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
    throw erroDeBanco("Não foi possível carregar os anexos.", error);
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

/**
 * Fecho da saga documento+vínculo (Bloco B/E8, gate B16).
 *
 * São três escritas em sistemas diferentes — storage, `patient_documents` e
 * `patient_story_attachments` — sem transação que as cubra. Este passo fecha
 * a saga com três garantias:
 *
 * 1. **Retry reutiliza**: o vínculo já existente (PK story+document) é o
 *    MESMO resultado — duplo clique não duplica nem vira erro para a pessoa.
 * 2. **Falha compensa**: vínculo recusado remove o documento recém-criado
 *    (linha E storage), COM guarda — um documento já vinculado a outra
 *    história nunca é removido, e a RLS impede compensar documento alheio.
 * 3. **Falha da compensação deixa rastro**: `register_patient_document_residue`
 *    grava o evento em `audit_logs` — o resíduo nunca fica invisível.
 */
export async function attachDocumentToStory(
  supabase: SupabaseClient,
  storyId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("patient_story_attachments")
    .insert({ story_id: storyId, document_id: documentId });

  if (!error) return;

  // O vínculo já existe (retry/duplo clique): mesmo resultado, nenhuma
  // escrita nova, carimbo original intacto.
  if (error.code === "23505") return;

  await compensarDocumentoSemVinculo(supabase, storyId, documentId, error.message);

  throw erroDeBanco("Não foi possível anexar o documento.", error);
}

// Compensação da saga: desfaz o documento que ficou sem o vínculo que
// justificava a sua criação. Nunca engole o erro original do vínculo — quem
// chama continua recebendo a recusa real; aqui só se decide o destino do
// resíduo (remoção ou rastro auditável).
async function compensarDocumentoSemVinculo(
  supabase: SupabaseClient,
  storyId: string,
  documentId: string,
  motivoDaRecusa: string,
): Promise<void> {
  try {
    // Guarda 1: documento vinculado a QUALQUER história não é resíduo — a
    // compensação jamais o remove (a remoção cascatearia os vínculos).
    const { count: vinculos, error: vinculosError } = await supabase
      .from("patient_story_attachments")
      .select("*", { count: "exact", head: true })
      .eq("document_id", documentId);
    if (vinculosError) {
      throw erroDeBanco("Não foi possível verificar os vínculos do documento.", vinculosError);
    }
    if ((vinculos ?? 0) > 0) return;

    // Guarda 2: sob RLS, só o próprio dono enxerga o documento. Documento
    // invisível é de outra pessoa (ou já não existe) — nada a compensar por
    // esta sessão.
    const { data: documento, error: documentoError } = await supabase
      .from("patient_documents")
      .select("profile_id")
      .eq("id", documentId)
      .maybeSingle();
    if (documentoError) {
      throw erroDeBanco("Não foi possível ler o documento a compensar.", documentoError);
    }
    if (!documento) return;

    // Remove linha E storage — banco e storage nunca divergem em silêncio.
    await deletePatientDocument(supabase, documentId, documento.profile_id as string);
  } catch (erroDaCompensacao) {
    // A compensação falhou: o resíduo existe DE VERDADE e precisa de rastro
    // observável no ledger da casa (audit_logs), além do log com referência.
    registrarErro("story.anexarDocumento.compensacao", erroDaCompensacao, {
      storyId,
      documentId,
      observacao: "documento criado sem vínculo e não removido",
    });

    const { error: rastroError } = await supabase.rpc("register_patient_document_residue", {
      _document_id: documentId,
      _reason: `Vínculo com a história recusado (${motivoDaRecusa}) e a compensação do documento falhou.`,
    });
    if (rastroError) {
      registrarErro("story.anexarDocumento.compensacao.rastro", rastroError, {
        storyId,
        documentId,
      });
    }
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
    throw erroDeBanco("Não foi possível remover o anexo.", error);
  }
}
