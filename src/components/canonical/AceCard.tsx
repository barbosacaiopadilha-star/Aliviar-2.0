import type { AceExperienceModel } from "@/experience-layer/contracts/experience-models";

interface AceCardProps {
  ace: AceExperienceModel;
}

export function AceCard({ ace }: AceCardProps) {
  if (ace.visibilidade === "AUSENTE") {
    return null;
  }

  const silencioso = ace.visibilidade === "SILENCIOSO";

  return (
    <section
      className={`card p-5 ${silencioso ? "border-sage/30 bg-sage-soft/30" : "border-coral/20 bg-coral-soft/40"}`}
      data-testid="ace-card"
      data-visibilidade={ace.visibilidade}
      aria-label="Acompanhante ACE"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sage">
        {silencioso ? "ACE — disponível se precisar" : "Sua ACE"}
      </p>
      <h2 className="mt-2 font-medium text-ink">
        {ace.responsavel.nome_exibicao ?? "Acompanhante Aliviar"}
      </h2>
      {ace.mensagem_contextual ? (
        <p className="mt-2 text-sm text-ink-soft">{ace.mensagem_contextual}</p>
      ) : null}
      {ace.pode_interagir && !silencioso ? (
        <p className="mt-3 text-sm font-medium text-coral" data-testid="ace-interact-hint">
          Disponível para conversar
        </p>
      ) : null}
    </section>
  );
}
