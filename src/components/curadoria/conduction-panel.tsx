/**
 * Painel de Condução — as cinco respostas que o Curador nunca deveria precisar
 * dar de cabeça.
 *
 * @metodo Fundamentos §8 — o ciclo da tecnologia: reconhece, explica, entrega ao Curador; ele decide
 * @metodo Engine §1 — o Motor emoldura a decisão e nunca a ocupa
 * @metodo Experience §3 — copiloto antecipa, sinaliza a lacuna e nunca bloqueia o caminho
 * @metodo Experience §5 — UX3: o próximo passo é sempre visível, único e nomeado pelo que faz
 *
 * Por que existe: o Portal conduz o Método para que o Curador possa conduzir o
 * paciente. Este painel responde onde ele está, o que falta, qual é o próximo
 * passo e o que está inconsistente — sempre, em qualquer ponto da Curadoria.
 *
 * O que nunca faz: avançar uma fase sozinho, impedir o Curador de voltar, ou
 * sugerir como resolver um conflito. Informar é o oposto de controlar.
 */

import Link from "next/link";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { COS_PHASE_LABELS, type ConductionState } from "@/modules/curadoria/cos/types";
import { CURADORIA_STEP_LABELS } from "@/modules/curadoria/types";
import { cn } from "@/components/ui/cn";

const ownerLabels = {
  CURADOR: "com você",
  PACIENTE: "com o paciente",
  EQUIPE: "com a equipe",
} as const;

export function ConductionPanel({ state, caseId }: { state: ConductionState; caseId: string }) {
  const isWaiting = state.nextStep.kind === "aguardando";

  return (
    <Card className="space-y-6 border-brand-gold/40">
      <CardHeader>
        <CardTitle>Onde você está</CardTitle>
        <CardDescription>
          {COS_PHASE_LABELS[state.currentPhase]}
          <span aria-hidden="true"> · </span>
          etapa do raciocínio: {CURADORIA_STEP_LABELS[state.currentReasoningStep]}
          <span aria-hidden="true"> · </span>
          {state.completedPhases.length} de 9 fases concluídas
        </CardDescription>
      </CardHeader>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-ink-muted">Próximo passo</h3>
        {isWaiting ? (
          <p className="mt-1.5 text-base text-ink">
            {state.nextStep.label}. <span className="text-ink-muted">{state.nextStep.description}</span>
          </p>
        ) : (
          <>
            <p className="mt-1.5 text-base font-medium text-ink">{state.nextStep.label}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{state.nextStep.description}</p>
            <Link
              href={`/portal-curador/casos/${caseId}/${state.nextStep.phase.toLowerCase()}`}
              className={cn(
                "mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface",
                "transition-colors duration-fast ease-standard hover:bg-brand-primary-deep",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              )}
            >
              Continuar
              <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>

      {state.missing.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">O que falta</h3>
          <ul className="mt-1.5 space-y-1">
            {state.missing.map((item) => (
              <li key={item} className="text-sm text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.inconsistencies.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">Inconsistências</h3>
          <ul className="mt-1.5 space-y-2">
            {state.inconsistencies.map((entry) => (
              <li key={`${entry.code}-${entry.description}`} className="text-sm text-ink">
                <span className="font-mono text-xs text-ink-muted">{entry.code}</span>
                <span aria-hidden="true"> · </span>
                {entry.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.alerts.length > 0 ? (
        <div className="space-y-3">
          {state.alerts.map((alert) => (
            <CaseAlert key={alert.code} {...alert} />
          ))}
        </div>
      ) : null}

      {state.pendencies.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">Pendências</h3>
          <ul className="mt-1.5 space-y-1">
            {state.pendencies.map((pendency) => (
              <li key={`${pendency.phase}-${pendency.description}`} className="text-sm text-ink-muted">
                {pendency.description}
                <span aria-hidden="true"> — </span>
                <span className="text-ink">{ownerLabels[pendency.owner]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
