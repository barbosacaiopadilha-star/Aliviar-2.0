import type { ButtonHTMLAttributes } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/components/ui/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-primary text-surface hover:bg-brand-primary-deep active:bg-brand-primary-deep",
  secondary:
    "border border-border bg-surface text-ink hover:bg-canvas active:bg-canvas",
  ghost: "bg-transparent text-brand-primary hover:bg-canvas active:bg-canvas",
  danger:
    "border border-error/30 bg-error-surface text-error hover:bg-error/10 active:bg-error/15",
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
