"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { StoryStepLayout } from "@/components/story/story-step-layout";
import { Radio } from "@/components/ui/radio";
import { useStoryDraft } from "@/modules/story/use-story-draft";

export default function PreferenciasPage() {
  const { data, update } = useStoryDraft();

  return (
    <StoryStepLayout
      step={6}
      totalSteps={7}
      title="Como você prefere se conectar?"
      backHref="/sua-historia/informacoes"
      nextHref="/sua-historia/revisao"
      nextDisabled={!data.preferenciaModalidade}
      footerSlot={<AutosaveIndicator />}
    >
      <fieldset className="space-y-4">
        <legend className="sr-only">Como você prefere se conectar?</legend>
        <Radio
          id="preferencia-online"
          name="preferencia-modalidade"
          value="online"
          label="Online"
          checked={data.preferenciaModalidade === "online"}
          onChange={() => update({ preferenciaModalidade: "online" })}
        />
        <Radio
          id="preferencia-presencial"
          name="preferencia-modalidade"
          value="presencial"
          label="Presencial"
          checked={data.preferenciaModalidade === "presencial"}
          onChange={() => update({ preferenciaModalidade: "presencial" })}
        />
        <Radio
          id="preferencia-tanto-faz"
          name="preferencia-modalidade"
          value="tanto-faz"
          label="Tanto faz"
          checked={data.preferenciaModalidade === "tanto-faz"}
          onChange={() => update({ preferenciaModalidade: "tanto-faz" })}
        />
      </fieldset>

      <p className="mt-8 text-sm text-ink-muted">
        Isso nos ajuda a pensar em opções que caibam na sua rotina.
      </p>
    </StoryStepLayout>
  );
}
