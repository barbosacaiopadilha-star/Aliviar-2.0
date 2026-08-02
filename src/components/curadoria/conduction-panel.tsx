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

import { ActionLink, StaticPendingItem } from "@/components/curadoria/action-link";
import { CaseAlert } from "@/components/curadoria/case-alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  buildPendingActionItems,
  getOwnerLabel,
  getPrimaryActionLabel,
  phaseHref,
} from "@/modules/curadoria/cos/conduction-ui";
import type { ConductionState } from "@/modules/curadoria/cos/types";
import {
  CURATOR_JOURNEY_DEFINITIONS,
  type CuratorJourney,
} from "@/modules/curadoria/cos/journey";
import { cn } from "@/components/ui/cn";

export function ConductionPanel({
  state,
  caseId,
  journey,
}: {
  state: ConductionState;
  caseId: string;
  journey: CuratorJourney;
}) {
  const isWaiting = state.nextStep.kind === "aguardando";
  const actionItems = buildPendingActionItems(state, caseId);
  const actionableItems = actionItems.filter((item) => item.href !== null);
  const passiveItems = actionItems.filter((item) => item.href === null);
  const primaryLabel = getPrimaryActionLabel(state);
  const primaryHref = phaseHref(caseId, state.nextStep.phase);

  return (
    <Card className="space-y-6 border-[color-mix(in_srgb,var(--color-brand-gold)_40%,transparent)]">
      <CardHeader>
        <CardTitle>Onde você está</CardTitle>
        <CardDescription>
          {/* A etapa da jornada, no vocabulário do Curador — não a fase interna.
              A etapa do raciocínio saiu do cabeçalho: é vocabulário do Método
              que ele já carrega, e disputava atenção com o próximo passo. */}
          {CURATOR_JOURNEY_DEFINITIONS[journey.currentStep].label}
          <span aria-hidden="true"> · </span>
          {journey.completedCount} de {journey.totalCount} etapas concluídas
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
              href={primaryHref}
              className={cn(
                "mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface",
                "transition-colors duration-fast ease-standard hover:bg-brand-primary-deep",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              )}
            >
              {primaryLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>

      {actionableItems.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">O que falta</h3>
          <ul className="mt-1 divide-y divide-[color-mix(in_srgb,var(--color-border)_60%,transparent)] sm:space-y-0" role="list">
            {actionableItems.map((item) => (
              <li key={item.id}>
                <ActionLink
                  description={item.description}
                  phase={item.phase}
                  href={item.href!}
                  ownerLabel={getOwnerLabel(item.owner)}
                />
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

      {passiveItems.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-muted">Pendências</h3>
          <ul className="mt-1 divide-y divide-[color-mix(in_srgb,var(--color-border)_60%,transparent)] sm:space-y-0" role="list">
            {passiveItems.map((item) => (
              <li key={item.id}>
                <StaticPendingItem
                  description={item.description}
                  ownerLabel={getOwnerLabel(item.owner)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
