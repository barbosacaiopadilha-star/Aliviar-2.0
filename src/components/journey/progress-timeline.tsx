import Link from "next/link";

import { cn } from "@/components/ui/cn";

/**
 * Progresso da jornada — etapas com estado e dependência explícita.
 *
 * @metodo Guided Experience §2 — perguntas 2 e 5 (o que aconteceu / o que vem depois)
 * @metodo UX_PRINCIPLES P4 — estado derivado de fato, nunca de rótulo
 *
 * Por que existe: o padrão das nove fases do COS ("Depende de: …", estado
 * por critério do Motor) é o melhor pedaço da experiência atual — este
 * componente o generaliza para QUALQUER jornada (lead do Atendente,
 * acompanhamento do Concierge, jornada do paciente), com uma implementação.
 *
 * O que nunca faz: marcar etapa como concluída por conta própria — o estado
 * chega pronto de quem deriva dos fatos (P4/P5).
 */
export type JourneyStage = {
  id: string;
  label: string;
  status: "done" | "current" | "available" | "blocked";
  /** O que falta OU de que depende — em linguagem humana. */
  detail?: string;
  /** Quando a etapa tem onde ser executada. Etapa atual SEM href é bug (P2). */
  href?: string;
};

const STATUS_META: Record<JourneyStage["status"], { symbol: string; label: string }> = {
  done: { symbol: "✓", label: "Concluída" },
  current: { symbol: "●", label: "Em andamento" },
  available: { symbol: "○", label: "Disponível" },
  blocked: { symbol: "🔒", label: "Bloqueada" },
};

export function ProgressTimeline({ stages, ariaLabel }: { stages: JourneyStage[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="space-y-2">
        {stages.map((stage, index) => {
          const meta = STATUS_META[stage.status];
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "text-sm font-medium",
                    stage.status === "blocked" ? "text-ink-muted" : "text-ink",
                  )}
                >
                  <span aria-hidden="true" className="mr-2 inline-block w-4 text-center">
                    {meta.symbol}
                  </span>
                  <span className="mr-1 text-ink-muted">{index + 1}</span> {stage.label}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">{meta.label}</span>
              </span>
              {stage.detail ? (
                <span className="mt-1 block pl-6 text-xs leading-relaxed text-ink-muted">{stage.detail}</span>
              ) : null}
            </>
          );

          const frame = cn(
            "block rounded-md border p-3 transition-colors duration-fast ease-standard",
            stage.status === "current" ? "border-brand-primary bg-surface" : "border-border bg-surface",
            stage.status === "blocked" && "opacity-70",
          );

          return (
            <li key={stage.id}>
              {stage.href && stage.status !== "blocked" ? (
                <Link
                  href={stage.href}
                  aria-current={stage.status === "current" ? "step" : undefined}
                  className={cn(
                    frame,
                    "hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <span aria-current={stage.status === "current" ? "step" : undefined} className={frame}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
