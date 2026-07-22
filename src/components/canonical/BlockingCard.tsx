import type { BloqueioView } from "@/experience-flow/contracts/jornada-view";

interface BlockingCardProps {
  bloqueio: BloqueioView;
}

export function BlockingCard({ bloqueio }: BlockingCardProps) {
  return (
    <section
      className="card border-coral/30 bg-coral-soft/20 p-5"
      data-testid="blocking-card"
      role="status"
      aria-label="Bloqueio ativo"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-coral">Aguardando você</p>
      <p className="mt-2 text-sm text-ink">{bloqueio.motivo_humano}</p>
      <time className="mt-2 block text-xs text-ink-soft" dateTime={bloqueio.desde}>
        Desde {new Date(bloqueio.desde).toLocaleDateString("pt-BR")}
      </time>
    </section>
  );
}
