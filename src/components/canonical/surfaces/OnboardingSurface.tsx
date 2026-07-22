import Link from "next/link";

import {
  HumanContactCard,
  JourneyHeader,
  NextStepCard,
  OnboardingProgress,
} from "@/components/canonical";
import type { OnboardingExperienceModel } from "@/experience-layer/contracts/experience-models";

interface OnboardingSurfaceProps {
  model: OnboardingExperienceModel;
}

export function OnboardingSurface({ model }: OnboardingSurfaceProps) {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-12" data-testid="onboarding-surface">
        <JourneyHeader
          titulo={model.etapa_atual_legivel}
          subtitulo={`${model.progresso.etapas_concluidas} de ${model.progresso.etapas_totais} etapas iniciais`}
        />

        <OnboardingProgress
          etapas={model.etapas_fluxo}
          percentual={model.progresso.percentual}
        />

        <NextStepCard proximo_passo={model.proximo_passo} />

        {model.gestor ? (
          <HumanContactCard
            responsavel={model.gestor}
            mensagem="Essa pessoa coordena sua jornada com cuidado."
          />
        ) : null}

        {model.pedido_atual ? (
          <section className="card p-5" data-testid="pedido-documento">
            <h2 className="font-medium text-ink">{model.pedido_atual.titulo}</h2>
            <p className="mt-2 text-sm text-ink-soft">{model.pedido_atual.descricao}</p>
          </section>
        ) : null}

        <footer className="border-t border-line pt-6">
          <Link href="/minha-jornada?fixture=ace" className="text-sm text-ink-soft underline">
            Ver demonstração de Minha Jornada
          </Link>
        </footer>
      </main>
    </div>
  );
}
