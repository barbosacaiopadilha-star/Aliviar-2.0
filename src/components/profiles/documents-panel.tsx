"use client";

import { FileText, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionResult } from "@/modules/profiles/types";

type DocumentItem = { id: string; fileName: string; fileSize: number | null };

type DocumentsPanelProps<T extends DocumentItem> = {
  initialDocuments: T[];
  uploadAction: (prevState: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  onDelete: (documentId: string) => Promise<ActionResult>;
  emptyTitle: string;
  emptyDescription: string;
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

// Reaproveitado pelo painel de documentos do profissional (admin) e do
// paciente (autosserviço) — a única diferença entre os dois é qual action
// é passada e o texto do estado vazio, nunca a mecânica de upload/remoção.
export function DocumentsPanel<T extends DocumentItem>({
  initialDocuments,
  uploadAction,
  onDelete,
  emptyTitle,
  emptyDescription,
}: DocumentsPanelProps<T>) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [uploadState, formAction, isUploading] = useActionState<ActionResult | undefined, FormData>(
    uploadAction,
    undefined,
  );

  function handleDelete(documentId: string) {
    setRemovingId(documentId);
    startTransition(async () => {
      const result = await onDelete(documentId);
      if (result.success) {
        setDocuments((current) => current.filter((doc) => doc.id !== documentId));
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          required
          aria-label="Selecionar documento"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-surface hover:file:bg-brand-primary-deep"
        />
        <Button type="submit" variant="secondary" isLoading={isUploading} className="w-full sm:w-auto">
          Enviar documento
        </Button>
      </form>

      {uploadState && !uploadState.success ? (
        <FormMessage variant="error">{uploadState.error}</FormMessage>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{document.fileName}</p>
                  <p className="text-xs text-ink-muted">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(document.id)}
                disabled={removingId === document.id}
                aria-label={`Remover ${document.fileName}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-canvas hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
