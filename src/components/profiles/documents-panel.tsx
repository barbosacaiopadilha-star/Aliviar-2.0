"use client";

import { FileText, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionResult } from "@/modules/profiles/types";

type DocumentItem = { id: string; fileName: string; fileSize: number | null };

type UploadResult<T> = ActionResult | { success: true; document: T };

type DocumentsPanelProps<T extends DocumentItem> = {
  initialDocuments: T[];
  uploadAction: (prevState: UploadResult<T> | undefined, formData: FormData) => Promise<UploadResult<T>>;
  onDelete: (documentId: string) => Promise<ActionResult>;
  emptyTitle: string;
  emptyDescription: string;
  /**
   * Lista para o seletor de arquivos do navegador. Opcional de propósito: o
   * painel serve dois domínios, e só o da paciente está sob a ADR-054.
   * **Nunca é validação** — quem decide é o servidor.
   */
  accept?: string;
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
  accept,
}: DocumentsPanelProps<T>) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [uploadState, formAction, isUploading] = useActionState<UploadResult<T> | undefined, FormData>(
    uploadAction,
    undefined,
  );

  // ETAPA 9: a lista atualiza sozinha quando o upload dá certo — sem exigir
  // recarregar a página. Duplicação acidental fica impedida pelo id.
  useEffect(() => {
    if (uploadState?.success && "document" in uploadState && uploadState.document) {
      const doc = uploadState.document;
      setDocuments((current) => (current.some((d) => d.id === doc.id) ? current : [doc, ...current]));
    }
  }, [uploadState]);

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
          // Vem por prop, e não de uma constante daqui: este painel também
          // serve os documentos do PROFISSIONAL, que não estão sob a ADR-054.
          // Fixar a lista da paciente aqui aplicaria o contrato dela a um
          // domínio que ninguém decidiu incluir. Ausente, o atributo some e o
          // comportamento anterior fica intacto.
          accept={accept}
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
      {uploadState?.success ? (
        <FormMessage variant="success">Documento enviado. Ele já aparece na lista abaixo.</FormMessage>
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
