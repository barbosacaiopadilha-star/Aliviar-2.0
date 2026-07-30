"use client";

/**
 * Action Link com scroll automático para o campo relevante na mesma página.
 *
 * @metodo Experience §5 — UX3: o próximo passo é sempre visível e nomeado pelo que faz
 * @metodo Experience §3 — copiloto antecipa; a pendência é a ação, sem botão duplicado
 *
 * Por que existe: em formulários longos (ex.: distribuição de prioridades), o
 * Curador não deve procurar onde corrigir — clicar na pendência leva ao campo.
 */

import { cn } from "@/components/ui/cn";

type ScrollActionLinkProps = {
  description: string;
  scrollTargetId: string;
  className?: string;
};

export function ScrollActionLink({ description, scrollTargetId, className }: ScrollActionLinkProps) {
  function handleActivate() {
    const target = document.getElementById(scrollTargetId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = target.querySelector<HTMLElement>(
      "input, textarea, button, select, [tabindex]:not([tabindex='-1'])",
    );
    if (focusable) {
      focusable.focus({ preventScroll: true });
    } else {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      className={cn(
        "group flex min-h-11 w-full items-start gap-3 rounded-md px-2 py-2.5 text-left",
        "transition-colors duration-fast ease-standard",
        "hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      )}
      aria-label={`Ir para: ${description}`}
    >
      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-gold" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm text-ink underline-offset-4 group-hover:text-brand-primary group-hover:underline group-focus-visible:text-brand-primary group-focus-visible:underline">
        {description}
      </span>
    </button>
  );
}
