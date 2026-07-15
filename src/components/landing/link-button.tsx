import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui/cn";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary:
    "border-2 border-brand-gold bg-brand-primary text-surface hover:bg-brand-primary-deep focus-visible:ring-offset-canvas",
  secondary:
    "border-2 border-brand-gold/60 bg-surface text-ink hover:border-brand-gold focus-visible:ring-offset-surface",
  ghost: "bg-transparent text-brand-primary hover:bg-canvas focus-visible:ring-offset-canvas",
};

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-[transform,background-color,border-color,box-shadow] duration-fast ease-standard hover:scale-[1.03] hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
