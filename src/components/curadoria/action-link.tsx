/**
 * Action Link — pendência ou etapa clicável que conduz o Curador à resolução.
 *
 * @metodo Experience §5 — UX3: o próximo passo é sempre visível e nomeado pelo que faz
 *
 * Por que existe: o Curador não deve procurar um botão separado para resolver
 * uma pendência — a própria pendência é a ação.
 */

import Link from "next/link";

import type { CosPhaseId } from "@/modules/curadoria/cos/types";
import { PHASE_ACTION_LABELS, phaseStepLabel } from "@/modules/curadoria/cos/conduction-ui";
import { cn } from "@/components/ui/cn";

type ActionLinkProps = {
  description: string;
  phase: CosPhaseId;
  href: string;
  ownerLabel?: string | null;
  className?: string;
};

const actionLinkClasses = cn(
  "group flex min-h-11 w-full items-start gap-3 rounded-md px-2 py-2.5 text-left",
  "transition-colors duration-fast ease-standard",
  "hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
);

const textClasses = cn(
  "text-sm text-ink underline-offset-4",
  "group-hover:text-brand-primary group-hover:underline",
  "group-focus-visible:text-brand-primary group-focus-visible:underline",
);

export function ActionLink({ description, phase, href, ownerLabel, className }: ActionLinkProps) {
  const actionLabel = PHASE_ACTION_LABELS[phase];
  const ariaLabel = `${actionLabel}: ${description}`;

  return (
    <Link href={href} className={cn(actionLinkClasses, className)} aria-label={ariaLabel}>
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={textClasses}>{description}</span>
        {ownerLabel ? (
          <span className="mt-0.5 block text-xs text-ink-muted">{ownerLabel}</span>
        ) : null}
        <span className="sr-only"> — {actionLabel}</span>
      </span>
      <span
        className="mt-0.5 shrink-0 text-xs text-ink-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        {phaseStepLabel(phase)} →
      </span>
    </Link>
  );
}

type StaticPendingItemProps = {
  description: string;
  ownerLabel?: string | null;
  className?: string;
};

/** Pendência passiva — aguardando outra pessoa, sem ação imediata do Curador. */
export function StaticPendingItem({ description, ownerLabel, className }: StaticPendingItemProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-start gap-3 rounded-md px-2 py-2.5",
        "border border-transparent",
        className,
      )}
      aria-label={ownerLabel ? `${description} — ${ownerLabel}` : description}
    >
      <span className="mt-1.5 size-2 shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-ink-muted)_40%,transparent)]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="text-sm text-ink-muted">{description}</span>
        {ownerLabel ? (
          <span className="mt-0.5 block text-xs text-ink-muted">{ownerLabel}</span>
        ) : null}
      </span>
    </div>
  );
}
