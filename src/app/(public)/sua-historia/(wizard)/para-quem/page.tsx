"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { Radio } from "@/components/ui/radio";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function ParaQuemPage() {
  const { data, update } = useStoryDraft();

  return (
    <StoryStepLayout
      step={2}
      totalSteps={7}
      title="Para quem é esta busca?"
      backHref="/sua-historia"
      nextHref="/sua-historia/motivo"
      nextDisabled={!data.paraQuem}
      footerSlot={<AutosaveIndicator />}
    >
      <fieldset className="space-y-4">
        <legend className="sr-only">Para quem é esta busca?</legend>
        <Radio
          id="para-quem-mim"
          name="para-quem"
          value="para-mim"
          label="Para mim"
          checked={data.paraQuem === "para-mim"}
          onChange={() => update({ paraQuem: "para-mim" })}
        />
        <Radio
          id="para-quem-outra-pessoa"
          name="para-quem"
          value="para-outra-pessoa"
          label="Para outra pessoa que eu acompanho"
          checked={data.paraQuem === "para-outra-pessoa"}
          onChange={() => update({ paraQuem: "para-outra-pessoa" })}
        />
      </fieldset>

      <p className="mt-8 text-sm text-ink-muted">
        Perguntamos isso para adaptar a conversa daqui pra frente ao seu contexto real.
      </p>
    </StoryStepLayout>
  );
}
