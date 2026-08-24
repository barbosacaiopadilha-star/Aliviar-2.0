"use client";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { CAMPO_NARRATIVO, StoryStepLayout } from "@/components/story/story-step-layout";
import { FormField } from "@/components/ui/form-field";
import { Radio } from "@/components/ui/radio";
import { Textarea } from "@/components/ui/textarea";
import { useStoryDraft } from "@/modules/story/use-story-draft";

/**
 * CORTE DE 23/08 (decisão do Fundador, "aplique todos os cortes"): o wizard
 * tinha sete passos para cinco perguntas — "para quem?" e "o que motivou?"
 * eram duas telas de uma pergunta só cada. Fundidas aqui: quem responde
 * "para quem" já está com o motivo na cabeça, é a mesma respiração.
 *
 * A rota `/sua-historia/motivo` virou redirect para cá: rascunhos antigos
 * com `currentStep = "motivo"` continuam retomando sem cair em tela morta,
 * e `STORY_STEPS` não muda — nenhuma migração, nenhum dado tocado.
 */
export default function ParaQuemPage() {
  const { data, update } = useStoryDraft();

  return (
    <StoryStepLayout
      step={2}
      totalSteps={5}
      title="Para quem é esta busca?"
      // ETAPA 9: todo o wizard exige sessão de paciente (o layout usa
      // requireRole), e /sua-historia devolve quem já tem história ao passo
      // atual — apontar para lá deixava o primeiro passo sem saída. Voltar,
      // aqui, é voltar para o painel dela.
      backHref="/paciente"
      nextHref="/sua-historia/historia"
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

      <div className="mt-10">
        <h2 className="font-serif text-lg font-medium text-[var(--patient-ink)]">
          E o que motivou esta busca?
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pode ser em poucas palavras — o que fizer sentido para você agora.
        </p>
        <div className="mt-4">
          <FormField
            label="Sua resposta"
            hideLabel
            htmlFor="motivo"
            hint="Você pode deixar em branco se preferir."
          >
            <Textarea
              id="motivo"
              name="motivo"
              rows={5}
              placeholder="Ex.: tenho sentido muita ansiedade nas últimas semanas..."
              className={CAMPO_NARRATIVO}
              value={data.motivo ?? ""}
              onChange={(event) => update({ motivo: event.target.value })}
            />
          </FormField>
        </div>
      </div>
    </StoryStepLayout>
  );
}
