import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";
import { Spinner } from "@/components/ui/spinner";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "default" | "ghost";
  isLoading?: boolean;
};

const sizeClasses = {
  sm: "min-h-10 min-w-10",
  md: "min-h-11 min-w-11",
};

export function IconButton({
  label,
  children,
  size = "md",
  variant = "default",
  isLoading = false,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" && "border border-border bg-surface text-ink hover:bg-canvas",
        variant === "ghost" && "bg-transparent text-ink-muted hover:bg-canvas hover:text-ink",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner size="sm" label="Carregando" /> : children}
    </button>
  );
}
