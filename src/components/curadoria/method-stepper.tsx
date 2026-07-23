/**
 * Indicador das sete etapas do raciocínio da Curadoria.
 *
 * @metodo Fundamentos §5.2 — o raciocínio é sempre a mesma sequência, em toda Curadoria
 * @metodo Ontologia §3.11 — Curadoria: Iniciada → Em análise → Comparação → Revisão → Concluída
 * @metodo Experience §5 — UX2: a pessoa nunca precisa lembrar de onde veio
 *
 * Por que existe: o Curador precisa saber, em um olhar, em que ponto do método
 * ele está — em qualquer tela, sem contar passos de cabeça. As sete palavras
 * são as mesmas no treinamento, no Portal e no Manual.
 *
 * O que nunca faz: mostrar percentual de conclusão. Progresso do método não é
 * progresso de barra — o Curador pode voltar a Priorizar depois de Comparar, e
 * voltar não é retrocesso (Fundamentos §5.2).
 */

import { CURADORIA_STEPS, CURADORIA_STEP_LABELS, type CuradoriaStep } from "@/modules/curadoria/types";
import { cn } from "@/components/ui/cn";

type MethodStepperProps = {
  current: CuradoriaStep;
  /** `compact` para cabeçalho de card; `full` para o topo de uma tela de trabalho. */
  variant?: "compact" | "full";
  className?: string;
};

export function MethodStepper({ current, variant = "full", className }: MethodStepperProps) {
  const currentIndex = CURADORIA_STEPS.indexOf(current);

  if (variant === "compact") {
    return (
      <p className={cn("text-xs uppercase tracking-wide text-ink-muted", className)}>
        <span className="text-ink">{CURADORIA_STEP_LABELS[current]}</span>
        <span aria-hidden="true"> · </span>
        <span>
          etapa {currentIndex + 1} de {CURADORIA_STEPS.length}
        </span>
      </p>
    );
  }

  return (
    <nav aria-label="Etapas da Curadoria" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {CURADORIA_STEPS.map((step, index) => {
          const isCurrent = step === current;
          const isPast = index < currentIndex;

          return (
            <li key={step} className="flex items-center gap-1">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium tracking-wide transition-colors duration-fast ease-standard",
                  isCurrent && "bg-brand-primary text-surface",
                  isPast && "text-ink",
                  !isCurrent && !isPast && "text-ink-muted",
                )}
              >
                {CURADORIA_STEP_LABELS[step]}
                {isPast ? <span className="sr-only"> (concluída)</span> : null}
              </span>
              {index < CURADORIA_STEPS.length - 1 ? (
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
