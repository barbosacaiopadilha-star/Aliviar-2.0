import type { ReactNode } from "react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cn } from "@/components/ui/cn";

export type PageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumb items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-ink-muted">{description}</p> : null}
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </header>
  );
}
