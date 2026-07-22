import {
  AceCard,
  BlockingCard,
  HumanContactCard,
  JourneyHeader,
  JourneyStageMap,
  JourneyStatus,
  JourneyTimeline,
  NextStepCard,
} from "@/components/canonical";
import type {
  AceExperienceModel,
  MinhaJornadaExperienceModel,
} from "@/experience-layer/contracts/experience-models";

interface MinhaJornadaSurfaceProps {
  model: MinhaJornadaExperienceModel;
  ace: AceExperienceModel | null;
}

export function MinhaJornadaSurface({ model, ace }: MinhaJornadaSurfaceProps) {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-12" data-testid="minha-jornada-surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <JourneyHeader titulo="Minha Jornada" estado_visivel={model.estado_visivel} />
          <JourneyStatus estado_visivel={model.estado_visivel} />
        </div>

        <NextStepCard proximo_passo={model.proximo_passo} />

        {model.bloqueio ? <BlockingCard bloqueio={model.bloqueio} /> : null}

        {ace && model.ace_disponivel ? <AceCard ace={ace} /> : null}

        <HumanContactCard
          responsavel={model.responsavel}
          mensagem="Quem está com você nesta etapa."
        />

        <section aria-label="Linha do tempo">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Linha do tempo</h2>
          <JourneyTimeline items={model.timeline} />
        </section>

        <section aria-label="Mapa da jornada">
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Suas etapas</h2>
          <JourneyStageMap etapas={model.mapa_etapas} />
        </section>
      </main>
    </div>
  );
}
