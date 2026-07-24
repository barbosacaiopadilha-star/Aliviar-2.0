import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "landing-btn landing-btn-primary border-brand-gold/70 bg-brand-primary text-surface hover:bg-brand-primary-deep focus-visible:ring-offset-canvas",
  secondary:
    "landing-btn landing-btn-secondary border-brand-gold/45 bg-surface/90 text-ink hover:border-brand-gold focus-visible:ring-offset-surface",
  ghost:
    "landing-btn landing-btn-ghost bg-transparent text-brand-primary focus-visible:ring-offset-canvas",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
