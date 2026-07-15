"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function HistoriaPage() {
  const { data, update } = useStoryDraft();
  const hasContent = Boolean(data.historia?.trim());

  return (
    <StoryStepLayout
      step={4}
      totalSteps={7}
      title="Conte sua história"
      description="Fale um pouco mais sobre o seu momento, do seu jeito e no seu tempo."
      backHref="/sua-historia/motivo"
      nextHref="/sua-historia/informacoes"
      nextDisabled={!hasContent}
      footerSlot={<AutosaveIndicator />}
    >
      <FormField
        label="Sua resposta"
        htmlFor="historia"
        hint="Fique à vontade para escrever quanto quiser."
      >
        <Textarea
          id="historia"
          name="historia"
          rows={7}
          className="min-h-44"
          value={data.historia ?? ""}
          onChange={(event) => update({ historia: event.target.value })}
        />
      </FormField>

      <p className="mt-6 text-sm text-ink-muted">
        Esta é a parte mais livre do processo — quanto mais contexto você compartilhar, mais fácil
        fica entender o seu momento com cuidado.
      </p>
    </StoryStepLayout>
  );
}
