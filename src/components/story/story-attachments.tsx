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
      listStoryAttachmentsAction(storyId).then(setAttachments);
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

      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          aria-label="Selecionar documento"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-surface hover:file:bg-brand-primary-deep"
        />
        <Button type="submit" variant="secondary" isLoading={isUploading} className="w-full sm:w-auto">
          Anexar
        </Button>
      </form>

      {uploadState && !uploadState.success ? <FormMessage variant="error">{uploadState.error}</FormMessage> : null}

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
