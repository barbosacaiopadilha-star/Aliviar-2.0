import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type DataToolbarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function DataToolbar({ search, filters, actions, className }: DataToolbarProps) {
  if (!search && !filters && !actions) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        {search ? <div className="min-w-[12rem] flex-1 sm:max-w-md">{search}</div> : null}
        {filters ? <div className="flex flex-wrap gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
