/**
 * Minha Jornada — linha do tempo orgânica e iluminada.
 *
 * @metodo Experience §2 — o paciente precisa ver onde está na jornada
 *
 * Por que existe: traduz o progresso da Curadoria em etapas compreensíveis
 * para o paciente, sem expor vocabulário interno.
 */

import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import { cn } from "@/components/ui/cn";
import type { Jornada, JornadaStage, JornadaStageStatus } from "@/modules/curadoria/jornada";

const statusLabels: Record<JornadaStageStatus, string> = {
  CONCLUIDA: "Concluída",
  EM_ANDAMENTO: "Acontecendo agora",
  AGUARDANDO_VOCE: "Sua vez",
  A_CAMINHO: "Próximo passo",
};

const markerClasses: Record<JornadaStageStatus, string> = {
  CONCLUIDA: "bg-[var(--color-brand-sage)] ring-4 ring-[color-mix(in_srgb,var(--color-brand-sage)_20%,transparent)]",
  EM_ANDAMENTO: "bg-[var(--patient-acento)] ring-4 ring-[color-mix(in_srgb,var(--patient-acento)_15%,transparent)] shadow-md",
  AGUARDANDO_VOCE: "bg-[var(--color-brand-gold)] ring-4 ring-[color-mix(in_srgb,var(--color-brand-gold)_20%,transparent)]",
  A_CAMINHO: "bg-white ring-2 ring-[var(--color-border)]",
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function StageRow({ stage, isLast }: { stage: JornadaStage; isLast: boolean }) {
  return (
    <li className="relative flex gap-5 pb-8 last:pb-0">
      {isLast ? null : (
        <span
          aria-hidden="true"
          className="patient-journey-line absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 rounded-full"
        />
      )}
      <span
        aria-hidden="true"
        className={cn("relative mt-1 size-[22px] shrink-0 rounded-full", markerClasses[stage.status])}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3
            className={cn(
              "font-serif text-lg",
              stage.status === "A_CAMINHO" ? "text-[var(--color-ink-muted)]" : "font-medium text-[var(--patient-ink)]",
            )}
          >
            {stage.label}
          </h3>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-brand-sage)]">
            {statusLabels[stage.status]}
          </span>
        </div>

        <p className="patient-body mt-2 text-[var(--color-ink-muted)]">{stage.description}</p>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--color-ink-muted)]">
          {stage.updatedAt ? <span>Atualizado em {formatDay(stage.updatedAt)}</span> : null}
          <span>Com {stage.responsible}</span>
        </div>

        {stage.nextAction ? (
          <p className="mt-3 text-sm">
            {stage.nextAction.owner === "VOCE" ? (
              <span className="font-medium text-[var(--patient-acento)]">{stage.nextAction.label}</span>
            ) : (
              <span className="text-[var(--color-ink-muted)]">{stage.nextAction.label}</span>
            )}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function JornadaTimeline({ jornada }: { jornada: Jornada }) {
  return (
    <PatientCard className="patient-fade-in">
      <ol className="relative">
        {jornada.stages.map((stage, index) => (
          <StageRow key={stage.id} stage={stage} isLast={index === jornada.stages.length - 1} />
        ))}
      </ol>
    </PatientCard>
  );
}
