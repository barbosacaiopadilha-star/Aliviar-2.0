import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const baseClasses =
  "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-[0.875rem] px-8 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-[520ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0";

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "landing-btn landing-btn-primary border border-transparent bg-[var(--color-brand-primary)] text-white shadow-[0_2px_8px_rgba(70,55,35,0.08)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[0_6px_20px_rgba(85,107,93,0.18)] focus-visible:ring-offset-[var(--color-bg-canvas)]",
  secondary:
    "landing-btn landing-btn-secondary border border-[rgba(183,154,91,0.55)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-brand-gold)] hover:bg-[rgba(183,154,91,0.07)] hover:shadow-[0_4px_14px_rgba(183,154,91,0.12)] focus-visible:ring-offset-[var(--color-bg-surface)]",
  ghost:
    "landing-btn landing-btn-ghost bg-transparent text-[var(--color-brand-primary)] hover:bg-[rgba(85,107,93,0.06)] focus-visible:ring-offset-[var(--color-bg-canvas)]",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
