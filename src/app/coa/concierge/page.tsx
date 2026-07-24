import Link from "next/link";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { PIPELINE_STAGE_LABELS } from "@/modules/crm/pipeline";
import { getConciergeDashboardData } from "@/modules/crm/repository";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export default async function CoaConciergeDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const dashboard = await getConciergeDashboardData(supabase, state.user.id);

  return (
    <DashboardLayout
      title="Concierge"
      description="Fila de Acompanhamentos — operacionalizar a jornada após a escolha do profissional."
      breadcrumbs={[{ label: "COA" }, { label: "Concierge" }]}
      primaryAction={
        <Link
          href="/admin/crm/agenda"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Agenda
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pacientes ativos" value={dashboard.metrics.activeCount} href="/admin/crm/contatos" />
          <KpiCard label="Pendências" value={dashboard.metrics.pendingTasksCount} href="/admin/crm/tarefas" />
          <KpiCard label="Consultas" value={dashboard.metrics.appointmentsCount} href="/admin/crm/agenda" />
          <KpiCard
            label="Alertas"
            value={dashboard.metrics.overdueCount}
            href="/admin/crm/tarefas"
            hint={dashboard.metrics.overdueCount > 0 ? "Requer atenção" : undefined}
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Pacientes ativos"
          href="/admin/crm/contatos"
          isEmpty={dashboard.activePatients.length === 0}
          emptyTitle="Nenhum acompanhamento ativo."
          emptyDescription="Após a escolha do profissional, o Assistido aparece aqui automaticamente."
        >
          <DashboardList
            items={dashboard.activePatients.map((c) => ({
              id: c.id,
              label: c.fullName,
              meta: PIPELINE_STAGE_LABELS[c.pipelineStage],
              href: `/admin/crm/contatos/${c.id}`,
            }))}
          />
        </DashboardSection>

        <DashboardSection
          title="Pendências"
          href="/admin/crm/tarefas"
          isEmpty={dashboard.pendingTasks.length === 0}
          emptyTitle="Nenhuma pendência."
        >
          <DashboardList
            items={dashboard.pendingTasks.map((t) => ({
              id: t.id,
              label: t.title,
              meta: t.contactName,
              href: `/admin/crm/contatos/${t.contactId}`,
            }))}
          />
        </DashboardSection>

        <DashboardSection
          title="Próximas consultas"
          href="/admin/crm/agenda"
          isEmpty={dashboard.upcomingAppointments.length === 0}
          emptyTitle="Nenhuma consulta agendada."
        >
          <DashboardList
            items={dashboard.upcomingAppointments.map((a) => ({
              id: a.id,
              label: a.title,
              meta: formatDateTime(a.startAt),
              href: `/admin/crm/contatos/${a.contactId}`,
            }))}
          />
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
