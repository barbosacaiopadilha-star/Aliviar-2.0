import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

import { PageHeader, type PageHeaderBreadcrumb } from "./page-header";

type DashboardLayoutProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  kpis?: ReactNode;
  alerts?: ReactNode;
  nextActions?: ReactNode;
  children?: ReactNode;
  recentActivity?: ReactNode;
  className?: string;
};

/**
 * Estrutura padrão de dashboards operacionais AOS-DC:
 * cabeçalho → KPIs → alertas → próximas ações → conteúdo → atividade recente.
 */
export function DashboardLayout({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  kpis,
  alerts,
  nextActions,
  children,
  recentActivity,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      />

      {kpis ? <section aria-label="Indicadores">{kpis}</section> : null}
      {alerts ? <section aria-label="Alertas">{alerts}</section> : null}
      {nextActions ? <section aria-label="Próximas ações">{nextActions}</section> : null}
      {children ? <section aria-label="Conteúdo principal">{children}</section> : null}
      {recentActivity ? <section aria-label="Atividade recente">{recentActivity}</section> : null}
    </div>
  );
}
