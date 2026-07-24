/**
 * Navegador das nove fases do COS — workflow guiado com estados visuais.
 *
 * @metodo Ontologia §3.11 — Curadoria: fases com critérios de entrada e saída próprios
 * @metodo Engine §2 — o Motor nunca avança um estado sozinho; toda transição tem ator humano
 * @metodo Fundamentos §5.2 — voltar a uma etapa anterior é o processo funcionando, não retrocesso
 * @metodo Experience §5 — UX2: sempre mostrar contexto; UX7: saída sempre disponível
 *
 * Por que existe: o Curador precisa enxergar a Curadoria inteira de uma vez —
 * o que já fechou, o que está aberto e o que ainda não pode começar, com o
 * motivo de cada bloqueio. Sem isso, ele precisaria abrir fase por fase para
 * descobrir onde parou.
 *
 * O que nunca faz: exibir percentual de conclusão, e nunca impedir a navegação
 * para uma fase já concluída. Uma fase bloqueada mostra o porquê em vez de
 * simplesmente ficar cinza — botão desabilitado sem explicação é burocracia,
 * não copiloto (Experience §6).
 */

import Link from "next/link";
import { CheckCircle2, Circle, CircleDot, Clock, Lock } from "lucide-react";

import {
  isPhaseNavigable,
  PHASE_STATUS_LABELS,
  phaseHref,
} from "@/modules/curadoria/cos/conduction-ui";
import { COS_PHASE_LABELS, type PhaseState, type PhaseStatus } from "@/modules/curadoria/cos/types";
import { cn } from "@/components/ui/cn";

const statusIcons: Record<PhaseStatus, typeof CheckCircle2> = {
  CONCLUIDA: CheckCircle2,
  EM_ANDAMENTO: CircleDot,
  DISPONIVEL: Circle,
  AGUARDANDO: Clock,
  BLOQUEADA: Lock,
};

const statusIconClasses: Record<PhaseStatus, string> = {
  CONCLUIDA: "text-brand-sage",
  EM_ANDAMENTO: "text-brand-primary",
  DISPONIVEL: "text-brand-gold",
  AGUARDANDO: "text-ink-muted",
  BLOQUEADA: "text-ink-muted/50",
};

const statusRowClasses: Record<PhaseStatus, string> = {
  CONCLUIDA: "border-brand-sage/40 bg-brand-sage-light/15",
  EM_ANDAMENTO: "border-brand-primary/50 bg-brand-primary/5 ring-1 ring-brand-primary/20",
  DISPONIVEL: "border-brand-gold/40 bg-surface hover:border-brand-primary/50",
  AGUARDANDO: "border-border bg-canvas hover:border-brand-primary/30",
  BLOQUEADA: "border-border/60 bg-canvas/80 opacity-75",
};

function PhaseRow({ state, index }: { state: PhaseState; index: number }) {
  const Icon = statusIcons[state.status];
  const label = COS_PHASE_LABELS[state.phase];
  const isCurrent = state.status === "EM_ANDAMENTO";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border p-3 transition-colors duration-fast ease-standard",
        statusRowClasses[state.status],
        isCurrent && "shadow-sm",
      )}
      aria-current={isCurrent ? "step" : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon
            className={cn("size-4 shrink-0", statusIconClasses[state.status])}
            aria-hidden="true"
          />
          <span className="font-mono text-xs text-ink-muted">{index + 1}</span>
          <span
            className={cn(
              "text-sm",
              state.status === "BLOQUEADA" ? "text-ink-muted" : "font-medium text-ink",
            )}
          >
            {label}
          </span>
        </div>
        <span className="text-xs text-ink-muted">{PHASE_STATUS_LABELS[state.status]}</span>
      </div>
      {state.status === "BLOQUEADA" ? (
        <p className="pl-[2.125rem] text-xs text-ink-muted">
          Depende de: {state.reason}
        </p>
      ) : state.missing.length > 0 && state.status !== "CONCLUIDA" ? (
        <p className="pl-[2.125rem] text-xs text-ink-muted">
          Falta: {state.missing[0]}
        </p>
      ) : null}
    </div>
  );
}

export function PhaseNavigator({ phases, caseId }: { phases: PhaseState[]; caseId: string }) {
  return (
    <nav aria-label="Workflow da Curadoria">
      <ol className="space-y-2">
        {phases.map((state, index) => {
          const navigable = isPhaseNavigable(state.status);
          const href = phaseHref(caseId, state.phase);
          const actionLabel = `Abrir ${COS_PHASE_LABELS[state.phase]}`;

          return (
            <li key={state.phase}>
              {navigable ? (
                <Link
                  href={href}
                  className={cn(
                    "block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                    "cursor-pointer",
                  )}
                  aria-label={actionLabel}
                >
                  <PhaseRow state={state} index={index} />
                </Link>
              ) : (
                <div aria-disabled="true" aria-label={`${COS_PHASE_LABELS[state.phase]} — bloqueada`}>
                  <PhaseRow state={state} index={index} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
