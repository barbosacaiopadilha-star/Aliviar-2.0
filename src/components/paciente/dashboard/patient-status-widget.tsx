import { CuratorAvatar, PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import type { Jornada, JornadaStage } from "@/modules/curadoria/jornada";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function resolveStatusCopy(stage: JornadaStage, curatorName: string) {
  if (stage.nextAction?.owner === "VOCE") {
    return {
      headline: "É a sua vez — no seu tempo.",
      detail: stage.nextAction.label,
    };
  }

  if (stage.status === "EM_ANDAMENTO" || stage.status === "A_CAMINHO") {
    return {
      headline: `${curatorName} está cuidando desta etapa.`,
      detail: stage.nextAction?.label ?? stage.description,
    };
  }

  return {
    headline: stage.label,
    detail: stage.description,
  };
}

type PatientStatusWidgetProps = {
  jornada: Jornada;
  currentStage: JornadaStage;
};

export function PatientStatusWidget({ jornada, currentStage }: PatientStatusWidgetProps) {
  const responsible = jornada.currentResponsible;
  const copy = resolveStatusCopy(currentStage, responsible.name);

  return (
    <PatientCard className="patient-fade-in">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
        Onde está meu caso?
      </p>

      <div className="mt-6 flex items-start gap-4">
        <CuratorAvatar name={responsible.name} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--color-ink-muted)]">Quem está cuidando de mim</p>
          <p className="font-serif text-xl font-medium text-[var(--patient-forest)]">
            {responsible.name}
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{responsible.roleLabel}</p>
        </div>
      </div>

      <div className="mt-8 space-y-2 border-t border-[var(--color-border)] pt-6">
        <p className="text-sm text-[var(--color-ink-muted)]">O que está acontecendo agora</p>
        <p className="font-serif text-2xl font-medium leading-snug text-[var(--patient-ink)]">
          {copy.headline}
        </p>
        <p className="patient-body text-[var(--color-ink-muted)]">{copy.detail}</p>
      </div>

      {jornada.promisedReturn ? (
        <div className="mt-6 rounded-xl bg-[var(--patient-linen)] px-4 py-3">
          <p className="text-sm text-[var(--color-ink-muted)]">Próximo passo combinado com você</p>
          <p className="mt-1 font-medium text-[var(--patient-ink)]">
            {formatDate(jornada.promisedReturn)}
          </p>
        </div>
      ) : null}
    </PatientCard>
  );
}
