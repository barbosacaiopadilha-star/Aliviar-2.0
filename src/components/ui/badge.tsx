import { cn } from "@/components/ui/cn";

type BadgeProps = {
  children: string;
  variant?: "default" | "accent" | "sage" | "gold" | "attention";
  className?: string;
};

// `accent` acompanha a atmosfera do cômodo; `attention` é condição humana —
// algo a conversar, jamais uma falha dela. Note o que NÃO existe aqui:
// nenhuma variante `success`, `danger` ou `error`. A ausência é a proteção
// (F2 §13.2, Nível 2) — quem precisar de um semáforo terá de criá-lo, e
// criar aparece em revisão.
const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-recessed text-ink border-border",
  accent: "bg-accent-soft text-ink border-[color-mix(in_srgb,var(--color-ambient-accent)_25%,transparent)]",
  sage: "bg-[color-mix(in_srgb,var(--color-brand-sage-light)_40%,transparent)] text-ink border-[color-mix(in_srgb,var(--color-brand-sage)_30%,transparent)]",
  gold: "bg-canvas text-ink border-[color-mix(in_srgb,var(--color-brand-gold)_40%,transparent)]",
  attention: "bg-attention-surface text-attention border-[color-mix(in_srgb,var(--color-attention)_25%,transparent)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium tracking-[0.01em]",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
