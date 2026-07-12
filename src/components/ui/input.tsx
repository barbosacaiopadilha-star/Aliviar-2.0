import type { InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hideLabel?: boolean;
};

export function Input({
  id,
  label,
  error,
  hideLabel = false,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          "block text-sm font-medium text-ink",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "block w-full rounded-sm border bg-surface px-3 py-2.5 text-sm text-ink shadow-sm transition-colors duration-fast ease-standard placeholder:text-ink-muted focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-error" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
