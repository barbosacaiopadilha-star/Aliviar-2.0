"use client";

import { FileText, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import {
  detachStoryDocumentAction,
  listStoryAttachmentsAction,
  uploadAndAttachStoryDocumentAction,
} from "@/modules/story/attachment-actions";
import type { StoryAttachment } from "@/modules/story/attachment-repository";
import type { StoryActionResult } from "@/modules/story/types";

type StoryAttachmentsProps = {
  storyId: string;
};

// Reaproveita a mesma tabela/bucket de documentos do paciente
// (patient_documents, SPRINT PORTAL DO PACIENTE) — só liga o documento a
// esta história (patient_story_attachments), sem novo mecanismo de upload.
export function StoryAttachments({ storyId }: StoryAttachmentsProps) {
  const [attachments, setAttachments] = useState<StoryAttachment[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    listStoryAttachmentsAction(storyId).then(setAttachments);
  }, [storyId]);

  const [uploadState, formAction, isUploading] = useActionState<StoryActionResult | undefined, FormData>(
    uploadAndAttachStoryDocumentAction.bind(null, storyId),
    undefined,
  );

  useEffect(() => {
    if (uploadState?.success) {
      // ETAPA 9: a lista atualiza sozinha E a pessoa ouve que deu certo —
      // ação importante nunca acontece sem retorno.
      listStoryAttachmentsAction(storyId).then(setAttachments);
      setFileName(null);
    }
  }, [uploadState, storyId]);

  function handleDetach(documentId: string) {
    setRemovingId(documentId);
    startTransition(async () => {
      const result = await detachStoryDocumentAction(storyId, documentId);
      if (result.success) {
        setAttachments((current) => current.filter((attachment) => attachment.documentId !== documentId));
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="mt-6 space-y-3 border-t border-border pt-6">
      <p className="text-sm font-medium text-ink">Anexos (opcional)</p>
      <p className="text-sm text-ink-muted">
        Se tiver um exame, laudo ou outro documento que ajude a entender seu momento, pode enviar aqui.
      </p>

      {/* O controle nativo dizia "Choose File / No file chosen" — voz do
          sistema operacional, em inglês, na etapa mais sensível da conversa
          (validação 2.4, mudança E). O input continua sendo o input (mesmo
          name, mesmo form, mesma action); só deixa de aparecer: quem fala é
          um rótulo da casa, e o nome do arquivo escolhido é dito em pt-BR. */}
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            required
            aria-label="Selecionar documento"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
            className="sr-only"
          />
          <span className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-fast ease-standard hover:bg-recessed">
            Escolher arquivo
          </span>
          <span className="min-w-0 truncate text-sm text-ink-muted">
            {fileName ?? "Nenhum arquivo escolhido ainda."}
          </span>
        </label>
        <Button type="submit" variant="secondary" isLoading={isUploading} className="w-full sm:w-auto">
          Anexar
        </Button>
      </form>

      {uploadState && !uploadState.success ? <FormMessage variant="error">{uploadState.error}</FormMessage> : null}
      {uploadState?.success ? (
        <FormMessage variant="success">Documento anexado. Ele já aparece na lista abaixo.</FormMessage>
      ) : null}

      {attachments.length > 0 ? (
        <ul className="divide-y divide-border">
          {attachments.map((attachment) => (
            <li key={attachment.documentId} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-2 text-sm text-ink">
                <FileText className="size-4 text-ink-muted" aria-hidden="true" />
                {attachment.fileName}
              </div>
              <button
                type="button"
                onClick={() => handleDetach(attachment.documentId)}
                disabled={removingId === attachment.documentId}
                aria-label={`Remover ${attachment.fileName}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
