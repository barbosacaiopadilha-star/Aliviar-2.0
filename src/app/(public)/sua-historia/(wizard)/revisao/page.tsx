"use client";

import { useState } from "react";

import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";
import { StoryNarrative } from "@/components/story/story-narrative";
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
      <SectionContainer className="py-16 lg:py-24">
        <SectionReveal className="mx-auto max-w-reading text-center">
          <h1 className="font-serif text-3xl font-medium leading-tight text-ink lg:text-4xl">
            Recebemos sua história
          </h1>
          <div className="mx-auto mt-6 max-w-reading space-y-4 text-base leading-relaxed text-ink-muted">
            <p>Agora ela será lida com cuidado pelo seu Curador.</p>
            <p>
              Nenhuma recomendação é feita automaticamente — cada história passa
              por revisão humana antes de qualquer orientação.
            </p>
            <p>
              Ela ficará disponível para a equipe Aliviar quando a próxima etapa
              da sua curadoria for iniciada.
            </p>
          </div>
        </SectionReveal>
      </SectionContainer>
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    const result = await submit();
    if (!result.success) {
      setError(
        result.error ?? "Não foi possível concluir agora. Tente novamente.",
      );
    }
    setIsSubmitting(false);
  }

  return (
    <StoryStepLayout
      step={7}
      totalSteps={7}
      title="Esta é a sua história."
      description="Confira o que você compartilhou. Você pode ajustar qualquer resposta antes de enviar."
      backHref="/sua-historia/preferencias"
      actionSlot={
        <Button
          type="button"
          className="landing-porta sm:w-auto"
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Enviar minha história
        </Button>
      }
    >
      <StoryNarrative data={data} />

      {error ? (
        <div className="mt-4">
          <FormMessage variant="error">{error}</FormMessage>
        </div>
      ) : null}

      <p className="mt-8 text-sm text-ink-muted">
        Seu Curador lê cada história com atenção antes de
        qualquer indicação — nunca por algoritmo automático.
      </p>
    </StoryStepLayout>
  );
}
