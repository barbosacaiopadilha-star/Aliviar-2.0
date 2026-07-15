"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function MotivoPage() {
  const { data, update } = useStoryDraft();

  return (
    <StoryStepLayout
      step={3}
      totalSteps={7}
      title="O que motivou esta busca?"
      description="Pode ser em poucas palavras — o que fizer sentido para você agora."
      backHref="/sua-historia/para-quem"
      nextHref="/sua-historia/historia"
      footerSlot={<AutosaveIndicator />}
    >
      <FormField label="Sua resposta" htmlFor="motivo" hint="Você pode deixar em branco se preferir.">
        <Textarea
          id="motivo"
          name="motivo"
          rows={5}
          placeholder="Ex.: tenho sentido muita ansiedade nas últimas semanas..."
          className="min-h-36"
          value={data.motivo ?? ""}
          onChange={(event) => update({ motivo: event.target.value })}
        />
      </FormField>
    </StoryStepLayout>
  );
}
