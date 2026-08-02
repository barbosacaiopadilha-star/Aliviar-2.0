import type { ButtonHTMLAttributes } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/components/ui/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

// A ação primária usa o acento do AMBIENTE, não uma cor fixa: no cômodo da
// paciente ela é azul, no da Curadoria é verde — e este arquivo não sabe
// disso. É o mecanismo da R20 (Continuidade Visual da Jornada): a atmosfera
// muda, o componente não. Secundário e fantasma seguem o mesmo acento;
// `danger` permanece institucional, porque impedimento não é atmosfera.
const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-surface hover:bg-accent-deep active:bg-accent-deep",
  secondary:
    "border border-border-strong bg-surface text-ink hover:bg-recessed active:bg-recessed",
  ghost: "bg-transparent text-accent hover:bg-accent-soft active:bg-accent-soft",
  danger:
    "border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)] bg-error-surface text-error hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

export function Button({
  children,
  className,
  isLoading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth && "w-full",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner size="sm" label="Carregando" /> : null}
      {isLoading ? "Aguarde..." : children}
    </button>
  );
}
