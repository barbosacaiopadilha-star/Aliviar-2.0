"use client";

import { useState } from "react";

import { StorySummary } from "@/components/story/story-summary";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function RevisaoPage() {
  const { data, status, submit } = useStoryDraft();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "enviada") {
    return (
      <StoryStepLayout step={7} totalSteps={7} title="Recebemos sua história">
        <p className="text-base text-ink-muted">
          Ela ficará disponível para a equipe Aliviar quando a próxima etapa da sua curadoria for
          iniciada.
        </p>
      </StoryStepLayout>
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    const result = await submit();
    if (!result.success) {
      setError(result.error ?? "Não foi possível concluir agora. Tente novamente.");
    }
    setIsSubmitting(false);
  }

  return (
    <StoryStepLayout
      step={7}
      totalSteps={7}
      title="Revise sua história"
      description="Confira o que você compartilhou. Você pode ajustar qualquer resposta antes de concluir."
      backHref="/sua-historia/preferencias"
      actionSlot={
        <Button type="button" className="sm:w-auto" isLoading={isSubmitting} onClick={handleSubmit}>
          Concluir
        </Button>
      }
    >
      <StorySummary data={data} editable />

      {error ? (
        <div className="mt-4">
          <FormMessage variant="error">{error}</FormMessage>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-ink-muted">
        Nossa equipe de curadoria analisa cada história com atenção antes de qualquer indicação —
        nunca por algoritmo automático.
      </p>
    </StoryStepLayout>
  );
}
