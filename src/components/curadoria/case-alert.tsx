/**
 * Alerta de exceção do Motor, exibido ao Curador.
 *
 * @metodo Engine §9 — toda exceção é nomeada, e nenhuma é resolvida pelo Motor
 * @metodo Engine §4.5 — conflito sobe para o humano; o Motor nomeia, quantifica e para
 * @metodo Experience §3 — copiloto sinaliza a lacuna, não bloqueia o caminho
 *
 * Por que existe: quando o Motor encontra um conflito ou uma exceção, ele
 * precisa dizer exatamente o quê, com o código rastreável, e devolver a decisão
 * ao Curador. Um alerta sem código não é rastreável; um alerta sem explicação
 * não é copiloto.
 *
 * O que nunca faz: sugerir a resolução. O texto descreve a situação e devolve a
 * escolha — nunca "recomendamos remover a restrição".
 */

import { cn } from "@/components/ui/cn";

export type CaseAlertSeverity = "atencao" | "bloqueio";

type CaseAlertProps = {
  code: string;
  title: string;
  detail: string;
  severity: CaseAlertSeverity;
  className?: string;
};

const severityClasses: Record<CaseAlertSeverity, string> = {
  // Atenção usa dourado — acento pontual de distinção, nunca preenchimento
  // grande (Brand: uso do dourado).
  atencao: "border-[color-mix(in_srgb,var(--color-brand-gold)_50%,transparent)] bg-canvas",
  bloqueio: "border-[color-mix(in_srgb,var(--color-warning)_40%,transparent)] bg-warning-surface",
};

const severityLabels: Record<CaseAlertSeverity, string> = {
  atencao: "Atenção",
  bloqueio: "Impede seguir",
};

export function CaseAlert({ code, title, detail, severity, className }: CaseAlertProps) {
  return (
    <div className={cn("rounded-md border p-4", severityClasses[severity], className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {severityLabels[severity]}
        </span>
        <span aria-hidden="true" className="text-border">
          ·
        </span>
        <span className="font-mono text-xs text-ink-muted" title="Código da exceção no Motor">
          {code}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{detail}</p>
    </div>
  );
}
