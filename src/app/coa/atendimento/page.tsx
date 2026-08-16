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
      // O acolhimento das pessoas acontece em /atendimento; esta tela é o
      // módulo de CRM que a sustenta. Dizer isso evita que as duas sejam
      // lidas como a mesma fila (mesma fronteira aplicada ao Concierge).
      description="Os números do módulo de CRM. Quem chegou e o que falta fazer por cada pessoa fica em Quem chegou."
      breadcrumbs={[{ label: "COA" }, { label: "Atendimento" }]}
      primaryAction={
        <Link
          href="/atendimento"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Quem chegou
        </Link>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Chegaram agora" value={dashboard.metrics.newContactsCount} href="/admin/crm/contatos" />
          <KpiCard label="Em contato" value={dashboard.metrics.inServiceCount} href="/admin/crm/funil" />
          <KpiCard label="Sem retorno registrado" value={awaitingResponse.length} href="/admin/crm/contatos" />
          <KpiCard label="Com acesso criado" value={converted.length} href="/admin/crm/funil" />
          <KpiCard label="Em acompanhamento" value={dashboard.metrics.contractedCount} href="/admin/crm/funil" />
          <KpiCard
            label="Consultas agendadas"
            value={dashboard.metrics.scheduledConsultationsCount}
            href="/admin/crm/agenda"
          />
        </div>
      }
    >
      {/*
        `min-w-0` nas duas seções não é enfeite: item de grid nasce com
        `min-width: auto`, e o rótulo de cada pessoa usa `truncate` — que é
        `white-space: nowrap`, cuja largura mínima é o nome INTEIRO. Sem isto,
        um nome real longo impede o cartão de encolher, a página passa a exigir
        mais que a tela (405px medidos em 390) e o Chrome móvel responde
        esticando o viewport de layout e reduzindo tudo ~6% — a Mesa chegava
        menor que as outras telas, sem estourar na horizontal.
      */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          className="min-w-0"
          title="Chegaram agora"
          href="/admin/crm/contatos"
          isEmpty={dashboard.newContacts.length === 0}
          emptyTitle="Ninguém novo chegou."
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
          className="min-w-0"
          title="Comigo agora"
          href="/admin/crm/contatos"
          isEmpty={dashboard.myQueue.length === 0}
          emptyTitle="Ninguém aguardando você."
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
