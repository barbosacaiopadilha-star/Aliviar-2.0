"use client";

import { Check } from "lucide-react";

import { useStoryDraft } from "@/modules/story/use-story-draft";

// Só lê `isSaving`/`data` do hook já existente — nenhuma mudança na lógica de
// autosave. Comunica o estado em linguagem humana, nunca técnica ("salvando",
// nunca "revision" ou "sincronizando com o servidor").
export function AutosaveIndicator() {
  const { isSaving, data } = useStoryDraft();
  const hasAnyAnswer = Object.values(data).some((value) => Boolean(value));

  if (!hasAnyAnswer && !isSaving) {
    return null;
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-muted" role="status" aria-live="polite">
      {isSaving ? (
        "Salvando automaticamente…"
      ) : (
        <>
          <Check className="size-3.5 text-success" aria-hidden="true" />
          Sua resposta foi salva.
        </>
      )}
    </p>
  );
}
