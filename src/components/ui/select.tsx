import type { SelectHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "block min-h-11 w-full rounded-sm border bg-surface px-3 py-2.5 text-sm text-ink shadow-sm transition-colors duration-fast ease-standard focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-60",
        error ? "border-error" : "border-border",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
