"use client";

import { Alert } from "@/components/ui/alert";
import { useStoryDraft } from "@/modules/story/use-story-draft";

// Aparece quando o autosave detecta que outra aba/dispositivo já salvou uma
// revisão mais nova (concorrência otimista, ADR-018) — a tela já foi
// atualizada com a versão mais recente do servidor; isto só avisa a pessoa.
export function StoryConflictBanner() {
  const { hasConflict, dismissConflict } = useStoryDraft();

  if (!hasConflict) {
    return null;
  }

  return (
    <div className="mx-auto mt-4 max-w-reading px-4 lg:px-8">
      <Alert variant="warning">
        <div className="flex items-center justify-between gap-4">
          <span>Sua história foi atualizada em outro dispositivo. Mostramos a versão mais recente.</span>
          <button
            type="button"
            onClick={dismissConflict}
            className="shrink-0 text-sm font-medium underline underline-offset-2"
          >
            Entendi
          </button>
        </div>
      </Alert>
    </div>
  );
}
