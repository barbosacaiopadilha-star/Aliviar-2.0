"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { StoryAttachments } from "@/components/story/story-attachments";
import { CAMPO_NARRATIVO, StoryStepLayout } from "@/components/story/story-step-layout";
import { FormField } from "@/components/ui/form-field";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { useStoryDraft } from "@/modules/story/use-story-draft";

/**
 * CORTE DE 23/08 · "há algo importante?" e "como prefere se conectar?" eram
 * duas telas — a segunda com três botões de rádio e mais nada. Fundidas
 * aqui, no mesmo movimento da fusão para-quem+motivo: sete passos viram
 * cinco. `/sua-historia/preferencias` virou redirect para cá.
 */
export default function InformacoesPage() {
  const { data, update, storyId } = useStoryDraft();

  return (
    <StoryStepLayout
      step={4}
      totalSteps={5}
      title="Há algo importante que devêssemos saber?"
      description="Qualquer contexto que ajude seu Curador a entender melhor o seu momento."
      backHref="/sua-historia/historia"
      nextHref="/sua-historia/revisao"
      nextDisabled={!data.preferenciaModalidade}
      footerSlot={<AutosaveIndicator />}
    >
      <FormField
        label="Sua resposta"
        hideLabel
        htmlFor="informacoes"
        hint="Você pode deixar em branco se preferir."
      >
        <Textarea
          id="informacoes"
          name="informacoes"
          rows={5}
          className={CAMPO_NARRATIVO}
          value={data.informacoesImportantes ?? ""}
          onChange={(event) => update({ informacoesImportantes: event.target.value })}
        />
      </FormField>

      <StoryAttachments storyId={storyId} />

      <div className="mt-10">
        <h2 className="font-serif text-lg font-medium text-[var(--patient-ink)]">
          Como você prefere se conectar?
        </h2>
        <fieldset className="mt-4 space-y-4">
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
        <p className="mt-4 text-sm text-ink-muted">
          Isso nos ajuda a pensar em opções que caibam na sua rotina.
        </p>
      </div>
    </StoryStepLayout>
  );
}
