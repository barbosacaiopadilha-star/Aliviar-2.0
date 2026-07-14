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

// Traço dourado na base, revelado via scaleX no hover/focus (só a variante
// primary, que tem fundo sólido — a assinatura precisa de contraste).
// prefers-reduced-motion já cai para ~0ms globalmente (globals.css).
const goldUnderline =
  "relative after:absolute after:inset-x-5 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-brand-gold after:transition-transform after:duration-base after:ease-standard hover:after:scale-x-100 focus-visible:after:scale-x-100";

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        variantClasses[variant],
        variant === "primary" && goldUnderline,
        className,
      )}
      {...props}
    />
  );
}
