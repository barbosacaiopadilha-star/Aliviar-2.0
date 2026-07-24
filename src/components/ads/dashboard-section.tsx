import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/components/ui/cn";

type DashboardSectionProps = {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
};

export function DashboardSection({
  title,
  description,
  href,
  linkLabel = "Ver tudo",
  action,
  emptyTitle,
  emptyDescription,
  emptyAction,
  isEmpty = false,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {href ? (
            <Link href={href} className="text-sm font-medium text-brand-primary hover:text-brand-primary-deep">
              {linkLabel}
            </Link>
          ) : null}
        </div>
      </CardHeader>

      {isEmpty && emptyTitle ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className="mx-0 border-0 bg-transparent py-8" />
      ) : (
        children
      )}
    </Card>
  );
}

type DashboardListItem = {
  id: string;
  label: string;
  meta?: string;
  href?: string;
};

export function DashboardList({
  items,
  className,
}: {
  items: DashboardListItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <ul className={cn("divide-y divide-border", className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
          {item.href ? (
            <Link href={item.href} className="min-w-0 truncate font-medium text-ink hover:text-brand-primary">
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 truncate font-medium text-ink">{item.label}</span>
          )}
          {item.meta ? <span className="shrink-0 text-ink-muted">{item.meta}</span> : null}
        </li>
      ))}
    </ul>
  );
}
