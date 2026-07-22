import type { EtapaFluxoOnboardingView } from "@/experience-layer/contracts/experience-models";

interface OnboardingProgressProps {
  etapas: EtapaFluxoOnboardingView[];
  percentual: number;
}

const STATUS_STYLE: Record<EtapaFluxoOnboardingView["status"], string> = {
  CONCLUIDA: "border-sage bg-sage-soft text-sage",
  ATUAL: "border-coral bg-coral-soft text-coral",
  FUTURA: "border-line bg-paper-raised text-ink-soft",
};

export function OnboardingProgress({ etapas, percentual }: OnboardingProgressProps) {
  return (
    <div data-testid="onboarding-progress">
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-coral transition-all"
          style={{ width: `${percentual}%` }}
          data-testid="onboarding-progress-bar"
          role="progressbar"
          aria-valuenow={percentual}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-5" aria-label="Etapas do onboarding">
        {etapas.map((etapa) => (
          <li
            key={etapa.codigo}
            className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${STATUS_STYLE[etapa.status]}`}
            data-testid={`onboarding-step-${etapa.codigo}`}
            data-status={etapa.status}
          >
            {etapa.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
