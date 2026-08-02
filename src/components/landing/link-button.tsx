import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const baseClasses =
  "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[0.875rem] px-8 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-[520ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0";

// Cores por token, nunca por literal: os rgba() que viviam aqui eram o
// verde e o dourado antigos digitados à mão — sobreviventes da deriva que a
// ADR-045 corrigiu, invisíveis à guarda de paleta por estarem em TSX.
const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "border border-transparent bg-[var(--color-brand-primary)] text-white shadow-sm hover:bg-[var(--color-brand-primary-hover)] hover:shadow-md focus-visible:ring-offset-[var(--color-bg-canvas)]",
  secondary:
    "border border-[color-mix(in_srgb,var(--color-brand-gold)_55%,transparent)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-brand-gold)] hover:bg-[color-mix(in_srgb,var(--color-brand-gold)_7%,transparent)] focus-visible:ring-offset-[var(--color-bg-surface)]",
  ghost:
    "bg-transparent text-[var(--color-brand-primary)] hover:bg-[color-mix(in_srgb,var(--color-ambient-accent)_6%,transparent)] focus-visible:ring-offset-[var(--color-bg-canvas)]",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
