import Link from "next/link";
import { CheckCircle2, Circle, CircleDot, Clock, Lock } from "lucide-react";

import { PHASE_STATUS_LABELS } from "@/modules/curadoria/cos/conduction-ui";
import { journeyStepHref, type CuratorJourney } from "@/modules/curadoria/cos/journey";
import type { PhaseStatus } from "@/modules/curadoria/cos/types";
import { cn } from "@/components/ui/cn";

/**
 * A Curadoria inteira — as sete etapas com estado e dependência explícita.
 *
 * @metodo Ontologia §3.11 — Curadoria: fases com critérios de entrada e saída próprios
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho
 * @metodo Fundamentos §5.2 — voltar a uma etapa anterior é o processo funcionando
 * @metodo Experience §5 — UX2: sempre mostrar contexto
 *
 * Por que existe: substitui o navegador de nove fases. O Curador precisa
 * enxergar a Curadoria de uma vez — e nove itens obrigam a ler a lista inteira
 * para achar onde ele está. Sete etapas com o nome do que ele pensa cabem em
 * uma olhada. Nenhuma fase do Método sumiu: cada etapa mostra, quando é o caso,
 * as fases canônicas que a compõem.
 *
 * O que nunca faz: exibir percentual, barra ou estimativa de tempo; e nunca
 * impedir a navegação para uma etapa já concluída. Uma etapa bloqueada mostra
 * o porquê em vez de ficar cinza — botão desabilitado sem explicação é
 * burocracia, não copiloto.
 */

const statusIcons: Record<PhaseStatus, typeof CheckCircle2> = {
  CONCLUIDA: CheckCircle2,
  EM_ANDAMENTO: CircleDot,
  DISPONIVEL: Circle,
  AGUARDANDO: Clock,
  BLOQUEADA: Lock,
};

const statusIconClasses: Record<PhaseStatus, string> = {
  CONCLUIDA: "text-brand-sage-deep",
  EM_ANDAMENTO: "text-brand-primary",
  DISPONIVEL: "text-brand-gold",
  AGUARDANDO: "text-ink-muted",
  BLOQUEADA: "text-[color-mix(in_srgb,var(--color-ink-muted)_50%,transparent)]",
};

const statusRowClasses: Record<PhaseStatus, string> = {
  CONCLUIDA: "border-[color-mix(in_srgb,var(--color-brand-sage)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-sage-light)_15%,transparent)]",
  EM_ANDAMENTO: "border-[color-mix(in_srgb,var(--color-brand-primary)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-primary)_5%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-brand-primary)_20%,transparent)]",
  DISPONIVEL: "border-[color-mix(in_srgb,var(--color-brand-gold)_40%,transparent)] bg-surface hover:border-[color-mix(in_srgb,var(--color-brand-primary)_50%,transparent)]",
  AGUARDANDO: "border-border bg-canvas hover:border-[color-mix(in_srgb,var(--color-brand-primary)_30%,transparent)]",
  BLOQUEADA: "border-[color-mix(in_srgb,var(--color-border)_60%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-canvas)_80%,transparent)] opacity-75",
};

type StepView = CuratorJourney["steps"][number];

function StepRow({ step }: { step: StepView }) {
  const Icon = statusIcons[step.status];
  const isCurrent = step.status === "EM_ANDAMENTO";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border p-3 transition-colors duration-fast ease-standard",
        statusRowClasses[step.status],
        isCurrent && "shadow-sm",
      )}
      aria-current={isCurrent ? "step" : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className={cn("size-4 shrink-0", statusIconClasses[step.status])} aria-hidden="true" />
          <span className="font-mono text-xs text-ink-muted">{step.order}</span>
          <span
            className={cn(
              "text-sm",
              step.status === "BLOQUEADA" ? "text-ink-muted" : "font-medium text-ink",
            )}
          >
            {step.label}
          </span>
        </div>
        <span className="text-xs text-ink-muted">{PHASE_STATUS_LABELS[step.status]}</span>
      </div>

      {step.status === "BLOQUEADA" && step.blockedReason ? (
        <p className="pl-[2.125rem] text-xs text-ink-muted">Depende de: {step.blockedReason}</p>
      ) : step.missing.length > 0 && step.status !== "CONCLUIDA" ? (
        // `step.missing` traz o CRITÉRIO DE SAÍDA do COS, e o Método escreve
        // alguns como condição já satisfeita ("O Curador registrou…") e outros
        // no infinitivo ("Selecionar…"). Prefixar "Falta:" quebrava os
        // primeiros: lia-se "Falta: O Curador registrou…", anunciando como
        // pendência uma frase no passado. O texto do Método não se altera para
        // acomodar a tela; a tela é que passa a apresentá-lo como item de
        // checklist ainda não cumprido, o que serve às duas redações.
        <p className="flex gap-1.5 pl-[2.125rem] text-xs text-ink-muted">
          <span aria-hidden="true">○</span>
          <span>
            <span className="sr-only">Ainda não cumprido: </span>
            {step.missing[0]}
          </span>
        </p>
      ) : null}
    </div>
  );
}

export function JourneyNavigator({ journey, caseId }: { journey: CuratorJourney; caseId: string }) {
  return (
    <nav aria-label="Etapas da Curadoria">
      {/* Um fato, não uma barra: quantas etapas fecharam. Sem percentual e sem
          previsão de tempo — a plataforma não sabe quanto dura uma conversa
          sobre saúde, e fingir que sabe vira pressão. */}
      <p className="mb-3 text-sm text-ink-muted">
        {journey.completedCount} de {journey.totalCount} etapas concluídas
      </p>

      <ol className="space-y-2">
        {journey.steps.map((step) => {
          const navigable = step.status !== "BLOQUEADA";

          return (
            <li key={step.id}>
              {navigable ? (
                <Link
                  href={journeyStepHref(caseId, step.id)}
                  className="block cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  aria-label={`Abrir ${step.label}`}
                >
                  <StepRow step={step} />
                </Link>
              ) : (
                <div aria-disabled="true" aria-label={`${step.label} — bloqueada`}>
                  <StepRow step={step} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
