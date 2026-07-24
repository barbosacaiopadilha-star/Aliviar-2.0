import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { getDashboardData } from "@/modules/crm/repository";
import { Card, CardHeader } from "@/components/ui/card";

export default async function CrmDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const dashboard = await getDashboardData(supabase, state.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">Painel do Concierge</h1>
          <p className="text-sm text-ink-muted">Olá, {state.profile?.displayName ?? "Concierge"} — sua fila operacional de hoje.</p>
        </div>
        <Link
          href="/admin/crm/contatos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface hover:bg-brand-primary-deep"
        >
          Novo contato
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Novos contatos" value={dashboard.metrics.newContactsCount} />
        <MetricCard label="Em atendimento" value={dashboard.metrics.inServiceCount} />
        <MetricCard label="Aguardando contratação" value={dashboard.metrics.awaitingContractingCount} />
        <MetricCard label="Contratados" value={dashboard.metrics.contractedCount} />
        <MetricCard label="Consultas agendadas" value={dashboard.metrics.scheduledConsultationsCount} />
        <MetricCard label="Atrasados" value={dashboard.metrics.overdueCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardList title="Novos contatos" href="/admin/crm/contatos" items={dashboard.newContacts.map((c) => ({ id: c.id, label: c.fullName, meta: c.source }))} />
        <DashboardList title="Minha fila" href="/admin/crm/contatos" items={dashboard.myQueue.map((c) => ({ id: c.id, label: c.fullName, meta: c.pipelineStage }))} />
        <DashboardList title="Retornos de hoje" href="/admin/crm/tarefas" items={dashboard.dueToday.map((t) => ({ id: t.id, label: t.title, meta: t.contactName }))} />
        <DashboardList title="Atrasados" href="/admin/crm/tarefas" items={dashboard.overdueTasks.map((t) => ({ id: t.id, label: t.title, meta: t.contactName }))} />
        <DashboardList title="Sem próxima ação" href="/admin/crm/contatos" items={dashboard.withoutNextAction.map((c) => ({ id: c.id, label: c.fullName, meta: "Sem ação" }))} />
        <DashboardList title="Consultas próximas" href="/admin/crm/agenda" items={dashboard.upcomingAppointments.map((a) => ({ id: a.id, label: a.title, meta: a.startAt }))} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="lg">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-brand-primary-deep">{value}</p>
    </Card>
  );
}

function DashboardList({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Array<{ id: string; label: string; meta: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
          <Link href={href} className="text-sm text-brand-primary hover:text-brand-primary-deep">
            Ver tudo
          </Link>
        </div>
      </CardHeader>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">Nada pendente neste bloco.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="font-medium text-ink">{item.label}</span>
              <span className="text-ink-muted">{item.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
