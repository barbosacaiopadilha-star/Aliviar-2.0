import { AceCard, HumanContactCard, JourneyTimeline } from "@/components/canonical";
import type {
  AceExperienceModel,
  AcompanhamentoExperienceModel,
} from "@/experience-layer/contracts/experience-models";

interface AcompanhamentoPortalSurfaceProps {
  model: AcompanhamentoExperienceModel;
  ace: AceExperienceModel | null;
}

export function AcompanhamentoPortalSurface({ model, ace }: AcompanhamentoPortalSurfaceProps) {
  return (
    <div data-testid="acompanhamento-portal-surface" className="space-y-6">
      <section className="card p-6">
        <h2 className="font-serif text-2xl font-semibold text-ink">Acompanhamento</h2>
        <p className="mt-2 text-ink-soft">
          Sua escolha foi registrada. Estamos com você nos próximos passos.
        </p>
        {model.escolha ? (
          <p className="mt-3 text-sm text-ink-soft" data-testid="escolha-resumo">
            Opção escolhida: {model.escolha.opcao_indice + 1}
          </p>
        ) : null}
        {model.tempo_estimado ? (
          <p className="mt-2 text-sm text-ink-soft">Próximo passo: {model.tempo_estimado}</p>
        ) : null}
      </section>

      {ace ? <AceCard ace={ace} /> : null}
      <HumanContactCard responsavel={model.responsavel} mensagem="Canal humano disponível." />

      <section aria-label="Linha do tempo">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Linha do tempo</h2>
        <JourneyTimeline items={model.timeline} />
      </section>
    </div>
  );
}
