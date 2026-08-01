import Link from "next/link";

import { DashboardLayout, DashboardList, DashboardSection, KpiCard } from "@/components/ads";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
import {
  CONNECTION_STATUS_LABELS,
  CONTACT_MODE_LABELS,
  readContinuity,
} from "@/modules/connection/continuity-labels";
import { loadContinuityWorklist } from "@/modules/connection/continuity-worklist";
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
  // A RLS é a autoridade: can_access_case decide o que aparece aqui. Esta
  // página não filtra por papel nem por id — se a policy não deixar ver, não
  // vem.
  const continuity = await loadContinuityWorklist(supabase);

  return (
    <DashboardLayout
      title="Concierge"
      description="Os casos que seguem com você depois da escolha, e o que ainda depende de alguém."
      breadcrumbs={[{ label: "COA" }, { label: "Concierge" }]}
      primaryAction={
        <Link
          href="/admin/crm/agenda"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Agenda
        </Link>
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
      <section className="mb-12">
        <h2 className="font-serif text-xl font-medium text-ink">A continuidade</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Casos que seguem com você depois da escolha. A ordem é a da decisão, não um juízo
          sobre quem precisa mais — não existe regra que defina isso.
        </p>

        {continuity.length === 0 ? (
          <p className="mt-5 max-w-2xl text-sm text-ink-muted">
            Nenhum caso com decisão registrada sob seus cuidados. Quando uma paciente decidir e
            o caso vier para você, ele aparece aqui.
          </p>
        ) : (
          <ul className="mt-5 space-y-5">
            {continuity.map((item) => {
              const leitura = readContinuity(item);
              return (
                <li
                  key={item.connectionId}
                  className="border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-medium text-ink">
                    Case {item.caseId.slice(0, 8)}
                    <span className="ml-2 font-normal text-ink-muted">
                      {CONNECTION_STATUS_LABELS[item.status]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {item.contactMode === null
                      ? "ela ainda não registrou como quer começar"
                      : CONTACT_MODE_LABELS[item.contactMode]}
                  </p>

                  {/* Ler não é fazer (ADR-044): o que foi visto e o que ainda
                      falta aparecem lado a lado, nunca um no lugar do outro.
                      Nenhuma marca temporal, nenhum "atrasado" — não existe
                      regra operacional aprovada que os defina. */}
                  {leitura.pending.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs text-ink-muted">Ainda não aconteceu</p>
                      <ul className="mt-1 space-y-0.5">
                        {leitura.pending.map((label) => (
                          <li key={label} className="text-sm text-ink">
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <p className="mt-2 text-sm text-ink-muted">
                    {leitura.unseen > 0
                      ? `${leitura.unseen} ${leitura.unseen === 1 ? "aviso ainda não aberto" : "avisos ainda não abertos"}`
                      : null}
                    {leitura.unseen > 0 && leitura.seen ? " · " : null}
                    {leitura.seen ? "alguém já viu, e o trabalho continua" : null}
                    {leitura.attempts > 0
                      ? `${leitura.unseen > 0 || leitura.seen ? " · " : ""}${leitura.attempts} ${
                          leitura.attempts === 1 ? "aproximação registrada" : "aproximações registradas"
                        }`
                      : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* A fronteira: o CRM é outro território, com outra origem e outro
          regime de autorização. Fica abaixo, nomeado, para que ninguém leia
          as duas coisas como uma fila só. */}
      <section className="border-t border-[var(--color-border)] pt-8">
        <h2 className="font-serif text-xl font-medium text-ink">O CRM</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Contatos, tarefas e compromissos do módulo de CRM. Origem diferente da continuidade
          acima — e as duas nunca se somam.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pacientes ativos" value={dashboard.metrics.activeCount} href="/admin/crm/contatos" />
          <KpiCard label="Tarefas abertas" value={dashboard.metrics.pendingTasksCount} href="/admin/crm/tarefas" />
          <KpiCard label="Consultas" value={dashboard.metrics.appointmentsCount} href="/admin/crm/agenda" />
          <KpiCard
            label="Tarefas com prazo passado"
            value={dashboard.metrics.overdueCount}
            href="/admin/crm/tarefas"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
      </section>
    </DashboardLayout>
  );
}
