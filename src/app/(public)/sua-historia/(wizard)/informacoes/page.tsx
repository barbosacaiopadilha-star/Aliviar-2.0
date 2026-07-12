"use client";

import { StoryAttachments } from "@/components/story/story-attachments";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function InformacoesPage() {
  const { data, update, storyId } = useStoryDraft();

  return (
    <StoryStepLayout
      step={5}
      totalSteps={7}
      title="Há algo importante que devêssemos saber?"
      description="Qualquer contexto que ajude nossa equipe a entender melhor o seu momento."
      backHref="/sua-historia/historia"
      nextHref="/sua-historia/preferencias"
    >
      <FormField
        label="Sua resposta"
        htmlFor="informacoes"
        hint="Você pode deixar em branco se preferir."
      >
        <Textarea
          id="informacoes"
          name="informacoes"
          rows={4}
          value={data.informacoesImportantes ?? ""}
          onChange={(event) => update({ informacoesImportantes: event.target.value })}
        />
      </FormField>

      <StoryAttachments storyId={storyId} />
    </StoryStepLayout>
  );
}
