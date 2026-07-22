import type { ProximoPassoView } from "@/experience-flow/contracts/jornada-view";

interface NextStepCardProps {
  proximo_passo: ProximoPassoView;
}

const DONO_LABEL: Record<ProximoPassoView["dono"], string> = {
  PACIENTE: "Seu passo",
  ALIVIAR: "Aliviar cuida",
  NENHUM: "Informação",
};

export function NextStepCard({ proximo_passo }: NextStepCardProps) {
  return (
    <section className="card p-5" data-testid="next-step-card" aria-label="Próximo passo">
      <p className="text-xs font-semibold uppercase tracking-wide text-sage">
        {DONO_LABEL[proximo_passo.dono]}
      </p>
      <h2 className="mt-2 font-serif text-xl font-semibold text-ink">{proximo_passo.titulo}</h2>
      <p className="mt-2 text-sm text-ink-soft">{proximo_passo.descricao}</p>
      {proximo_passo.acao_disponivel ? (
        <p className="mt-3 text-xs text-coral" data-testid="next-step-action-hint">
          Ação disponível
        </p>
      ) : null}
    </section>
  );
}
