import Link from "next/link";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { CONTACT_SOURCE_LABELS } from "@/modules/crm/types";
import { PIPELINE_STAGE_LABELS } from "@/modules/crm/pipeline";
import { getDashboardData } from "@/modules/crm/repository";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export default async function CrmDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const dashboard = await getDashboardData(supabase, state.user.id);

  return (
    <DashboardLayout
      title="Painel do Concierge"
      description={`Olá, ${state.profile?.displayName ?? "Concierge"} — sua fila operacional de hoje.`}
      breadcrumbs={[
        { label: "CRM", href: "/admin/crm" },
        { label: "Painel" },
      ]}
      primaryAction={
        <Link
          href="/admin/crm/contatos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Criar contato
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Novos contatos" value={dashboard.metrics.newContactsCount} href="/admin/crm/contatos" />
          <KpiCard label="Em atendimento" value={dashboard.metrics.inServiceCount} href="/admin/crm/funil" />
          <KpiCard label="Aguardando contratação" value={dashboard.metrics.awaitingContractingCount} href="/admin/crm/funil" />
          <KpiCard label="Contratados" value={dashboard.metrics.contractedCount} href="/admin/crm/funil" />
          <KpiCard label="Consultas agendadas" value={dashboard.metrics.scheduledConsultationsCount} href="/admin/crm/agenda" />
          <KpiCard
            label="Atrasados"
            value={dashboard.metrics.overdueCount}
            href="/admin/crm/tarefas"
            hint={dashboard.metrics.overdueCount > 0 ? "Requer atenção" : undefined}
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
          <DashboardSection
            title="Novos contatos"
            href="/admin/crm/contatos"
            isEmpty={dashboard.newContacts.length === 0}
            emptyTitle="Nenhum contato novo."
            emptyDescription="Quando novos leads entrarem, eles aparecerão aqui."
            emptyAction={
              <Link href="/admin/crm/contatos/novo" className="text-sm font-medium text-brand-primary">
                Criar primeiro contato
              </Link>
            }
          >
            <DashboardList
              items={dashboard.newContacts.map((c) => ({
                id: c.id,
                label: c.fullName,
                meta: CONTACT_SOURCE_LABELS[c.source],
                href: `/admin/crm/contatos/${c.id}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Minha fila"
            href="/admin/crm/contatos"
            isEmpty={dashboard.myQueue.length === 0}
            emptyTitle="Sua fila está vazia."
            emptyDescription="Contatos atribuídos a você aparecerão nesta seção."
          >
            <DashboardList
              items={dashboard.myQueue.map((c) => ({
                id: c.id,
                label: c.fullName,
                meta: PIPELINE_STAGE_LABELS[c.pipelineStage],
                href: `/admin/crm/contatos/${c.id}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Retornos de hoje"
            href="/admin/crm/tarefas"
            isEmpty={dashboard.dueToday.length === 0}
            emptyTitle="Nenhum retorno para hoje."
          >
            <DashboardList
              items={dashboard.dueToday.map((t) => ({
                id: t.id,
                label: t.title,
                meta: t.contactName,
                href: `/admin/crm/contatos/${t.contactId}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Atrasados"
            href="/admin/crm/tarefas"
            isEmpty={dashboard.overdueTasks.length === 0}
            emptyTitle="Nada atrasado."
          >
            <DashboardList
              items={dashboard.overdueTasks.map((t) => ({
                id: t.id,
                label: t.title,
                meta: t.contactName,
                href: `/admin/crm/contatos/${t.contactId}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Sem próxima ação"
            href="/admin/crm/contatos"
            isEmpty={dashboard.withoutNextAction.length === 0}
            emptyTitle="Todos os contatos têm próxima ação."
          >
            <DashboardList
              items={dashboard.withoutNextAction.map((c) => ({
                id: c.id,
                label: c.fullName,
                meta: "Sem ação",
                href: `/admin/crm/contatos/${c.id}`,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            title="Consultas próximas"
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
