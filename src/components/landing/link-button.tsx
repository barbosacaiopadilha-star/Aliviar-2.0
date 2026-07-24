import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "border-2 border-[var(--landing-forest,var(--color-brand-primary))] bg-[var(--landing-forest,var(--color-brand-primary))] text-[var(--landing-linen,var(--color-bg-surface))] hover:bg-[var(--color-brand-primary-deep)] focus-visible:ring-offset-canvas",
  secondary:
    "border border-[var(--color-border)] bg-white text-[var(--landing-ink,var(--color-ink))] shadow-sm hover:border-[var(--landing-forest,var(--color-brand-primary))] hover:shadow-md focus-visible:ring-offset-surface",
  ghost:
    "bg-transparent text-[var(--landing-forest,var(--color-brand-primary))] hover:bg-[var(--landing-linen,var(--color-bg-canvas))] focus-visible:ring-offset-canvas",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
