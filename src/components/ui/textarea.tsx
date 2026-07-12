import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "block min-h-28 w-full rounded-sm border bg-surface px-3 py-2.5 text-sm text-ink shadow-sm transition-colors duration-fast ease-standard placeholder:text-ink-muted focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 disabled:cursor-not-allowed disabled:opacity-60",
        error ? "border-error" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
