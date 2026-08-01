import Link from "next/link";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import {
  loadContinuityWorklist,
  type ContinuityWorkItem,
} from "@/modules/connection/continuity-worklist";
import type { ConnectionStatus, ContactMode } from "@/modules/connection/types";
import { PIPELINE_STAGE_LABELS } from "@/modules/crm/pipeline";
import { getConciergeDashboardData } from "@/modules/crm/repository";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

// Rótulos descritivos do fato registrado — nunca julgamento sobre a paciente
// nem sobre o andamento.
const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  DECISAO_REGISTRADA: "decisão registrada",
  CONTATO_INICIADO: "a paciente declarou ter iniciado o contato",
  PRIMEIRO_ATENDIMENTO_REALIZADO: "primeiro atendimento registrado",
  ENCERRADO_SEM_RELACIONAMENTO: "encerrado sem relacionamento",
};

const CONTACT_MODE_LABELS: Record<ContactMode, string> = {
  CONTATO_DIRETO_ACOMPANHADO: "ela prefere entrar em contato diretamente",
  APROXIMACAO_INTERMEDIADA: "ela pediu que a Aliviar faça a aproximação",
};

/**
 * O que está pendente, dito como fato observável.
 *
 * Nenhum item usa tempo, nenhum chama ausência de resposta de desfecho, e
 * "alguém já viu" aparece justamente para tornar visível que ler não executa.
 */
function pendingLabels(item: ContinuityWorkItem): string[] {
  const labels: string[] = [];
  if (item.awaitingContactMode) labels.push("ela ainda não disse como quer começar");
  if (item.intermediatedWithoutOpenAttempt)
    labels.push("ela pediu a aproximação e não há tentativa aberta");
  if (item.attemptCreatedNotDispatched) labels.push("tentativa criada, ainda não despachada");
  if (item.attemptDispatchedWithoutResponse)
    labels.push("tentativa despachada, sem resposta registrada");
  if (item.unavailabilityNeedsAction)
    labels.push("o profissional respondeu que não está disponível");
  if (item.unreadNotifications > 0)
    labels.push(
      item.unreadNotifications === 1
        ? "1 aviso ainda não visto"
        : `${item.unreadNotifications} avisos ainda não vistos`,
    );
  if (item.readButStillPending) labels.push("já visto, e o trabalho continua");
  return labels;
}

export default async function CoaConciergeDashboardPage() {
  const state = await requireAnyRole(["administrador", "concierge"]);
  const supabase = await createServerSupabaseClient();
  const dashboard = await getConciergeDashboardData(supabase, state.user.id);
  // A RLS é a autoridade: can_access_case decide o que aparece aqui. Esta
  // página não filtra por papel nem por id — se a policy não deixar ver, não
  // vem.
  const continuity = await loadContinuityWorklist(supabase);

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
      {/*
        Continuidade Pós-Decisão — seção deliberadamente SEPARADA das três
        seções de CRM abaixo.

        As duas não são a mesma fonte de trabalho: a fila de CRM vem de
        crm_contacts/crm_tasks/crm_appointments; esta vem de connection_records,
        pela responsabilidade atual do Case. Somá-las num contador único ou
        apresentá-las como lista contínua faria o operador perder de onde veio
        cada item — e são regimes de autorização diferentes.

        É projeção de leitura (NT-4): nenhuma entidade de tarefa foi criada.
        Não há prioridade, "atrasado" ou qualquer marca temporal, porque não
        existe regra operacional aprovada que os defina.
      */}
      <section className="mb-8 rounded-xl border border-[var(--color-border)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Continuidade pós-decisão
        </h2>
        <p className="mt-1 text-sm text-ink">
          Casos sob sua responsabilidade em que a paciente já decidiu. Origem
          distinta da fila de CRM abaixo.
        </p>

        {continuity.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Nenhum caso sob sua responsabilidade com decisão registrada.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {continuity.map((item) => (
              <li key={item.connectionId} className="py-3 text-sm">
                <span className="font-medium text-ink">
                  Case {item.caseId.slice(0, 8)}
                </span>
                <span className="ml-2 text-ink-muted">
                  {CONNECTION_STATUS_LABELS[item.status]}
                </span>
                <span className="ml-2 text-ink-muted">
                  ·{" "}
                  {item.contactMode === null
                    ? "modo de contato ainda não registrado"
                    : CONTACT_MODE_LABELS[item.contactMode]}
                </span>

                {/*
                  Trabalho pendente derivado de fatos. Nenhuma marca temporal,
                  nenhum "atrasado", nenhum status inferido — não existe regra
                  operacional aprovada que os defina.
                */}
                {pendingLabels(item).length > 0 ? (
                  <ul className="mt-1 ml-1 space-y-0.5">
                    {pendingLabels(item).map((label) => (
                      <li key={label} className="text-sm text-ink">
                        · {label}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.totalAttempts > 0 ? (
                  <p className="mt-1 ml-1 text-sm text-ink-muted">
                    · {item.totalAttempts}{" "}
                    {item.totalAttempts === 1
                      ? "tentativa registrada"
                      : "tentativas registradas"}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

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
