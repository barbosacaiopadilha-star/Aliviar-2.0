import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const baseClasses =
  "inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium tracking-[0.01em] transition-all duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0";

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "border border-transparent bg-[var(--color-brand-primary)] text-white shadow-[0_2px_8px_rgba(70,55,35,0.08)] hover:bg-[var(--color-brand-primary-hover)] hover:shadow-[0_4px_16px_rgba(70,55,35,0.1)] focus-visible:ring-offset-[var(--color-bg-canvas)]",
  secondary:
    "border border-[var(--color-brand-gold)] bg-transparent text-[var(--color-ink)] hover:border-[var(--color-brand-gold-hover)] hover:bg-[rgba(183,154,91,0.08)] focus-visible:ring-offset-[var(--color-bg-surface)]",
  ghost:
    "bg-transparent text-[var(--color-brand-primary)] hover:bg-[rgba(85,107,93,0.06)] focus-visible:ring-offset-[var(--color-bg-canvas)]",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
