"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { Textarea } from "@/components/ui/textarea";
import { addCaseNoteAction } from "@/modules/cases/actions";
import type { CaseNote } from "@/modules/cases/types";

type CaseNotesLogProps = {
  caseId: string;
  initialNotes: CaseNote[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Histórico append-only (ajuste pós-Sprint 2): só acrescenta, nunca edita ou
// apaga uma nota anterior — de propósito simples, não é uma thread de
// comentários.
export function CaseNotesLog({ caseId, initialNotes }: CaseNotesLogProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addCaseNoteAction({ caseId, body: draft });
      if (result.success) {
        setNotes((current) => [result.note, ...current]);
        setDraft("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          aria-label="Nova nota"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Adicionar uma nota interna..."
        />
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          isLoading={isPending}
          disabled={!draft.trim()}
          onClick={handleAdd}
        >
          Adicionar nota
        </Button>
        {error ? <FormMessage variant="error">{error}</FormMessage> : null}
      </div>

      {notes.length === 0 ? (
        <EmptyState title="Nenhuma nota registrada ainda." />
      ) : (
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="py-3">
              <p className="text-sm text-ink">{note.body}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {note.authorName} — {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
