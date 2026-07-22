import { HumanContactCard, NextStepCard } from "@/components/canonical";
import type { CuradoriaExperienceModel } from "@/experience-layer/contracts/experience-models";

interface CuradoriaPortalSurfaceProps {
  model: CuradoriaExperienceModel;
}

export function CuradoriaPortalSurface({ model }: CuradoriaPortalSurfaceProps) {
  return (
    <div data-testid="curadoria-portal-surface" className="space-y-6">
      <section className="card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sage">Curadoria</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">Em análise</h2>
        <p className="mt-3 text-ink-soft">{model.explicacao}</p>
        <p className="mt-4 text-sm text-ink-soft" data-testid="curadoria-status">
          Status: {model.status === "AGUARDANDO" ? "Aguardando" : "Em andamento"}
        </p>
      </section>
      <NextStepCard proximo_passo={model.proximo_passo} />
      <HumanContactCard responsavel={model.responsavel} mensagem="Seu curador nesta etapa." />
    </div>
  );
}
