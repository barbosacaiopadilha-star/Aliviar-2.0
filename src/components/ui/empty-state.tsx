import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-[color-mix(in_srgb,var(--color-bg-recessed)_60%,transparent)] px-6 py-12 text-center",
        className,
      )}
    >
      <h2 className="font-sans text-lg font-medium text-ink">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-reading text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
