import Link from "next/link";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import { ATENDIMENTO_PIPELINE_STAGES } from "@/modules/coa/levels";
import { CONTACT_SOURCE_LABELS } from "@/modules/crm/types";
import { PIPELINE_STAGE_LABELS } from "@/modules/crm/pipeline";
import { getDashboardData, listContacts } from "@/modules/crm/repository";

export default async function CoaAtendimentoDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const [dashboard, contacts] = await Promise.all([
    getDashboardData(supabase, state.user.id),
    listContacts(supabase),
  ]);

  const atendimentoContacts = contacts.filter((c) =>
    ATENDIMENTO_PIPELINE_STAGES.includes(c.pipelineStage),
  );
  const awaitingResponse = atendimentoContacts.filter(
    (c) => c.pipelineStage === "first_response_pending",
  );
  const converted = atendimentoContacts.filter((c) =>
    ["contracted", "initial_consultation_scheduling", "initial_consultation_scheduled"].includes(
      c.pipelineStage,
    ),
  );

  return (
    <DashboardLayout
      title="Atendimento"
      description="Fila de Leads — transformar contato em Assistido e encaminhar à Curadoria."
      breadcrumbs={[{ label: "COA" }, { label: "Atendimento" }]}
      primaryAction={
        <Link
          href="/admin/crm/contatos/novo"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Cadastrar Lead
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Leads novos" value={dashboard.metrics.newContactsCount} href="/admin/crm/contatos" />
          <KpiCard label="Em contato" value={dashboard.metrics.inServiceCount} href="/admin/crm/funil" />
          <KpiCard label="Aguardando resposta" value={awaitingResponse.length} href="/admin/crm/contatos" />
          <KpiCard label="Convertidos" value={converted.length} href="/admin/crm/funil" />
          <KpiCard label="Contratações" value={dashboard.metrics.contractedCount} href="/admin/crm/funil" />
          <KpiCard
            label="Consultas agendadas"
            value={dashboard.metrics.scheduledConsultationsCount}
            href="/admin/crm/agenda"
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Leads novos"
          href="/admin/crm/contatos"
          isEmpty={dashboard.newContacts.length === 0}
          emptyTitle="Nenhum lead novo."
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
      </div>
    </DashboardLayout>
  );
}
