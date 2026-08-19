import Link from "next/link";

import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PERIODS,
  buildFunnel,
  buildTimeSeries,
  casesByRole,
  casesByStatus,
  computeIndicators,
  leadsBySource,
  type Metric,
  type PeriodKey,
} from "@/modules/admin/dashboard-metrics";
import { loadDashboardSource } from "@/modules/admin/dashboard-repository";
import { requireRole } from "@/modules/auth/guard";
import { listProfessionalProfiles } from "@/modules/profiles";
import { listRecentAuditLogs, listTeamMembers } from "@/modules/team/repository";

import { AuditLogList } from "@/components/admin/audit-log-list";
import { BarsChart, FunnelChart, TrendChart } from "@/components/admin/charts";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/modules/cases/types";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Administrador",
  robots: { index: false, follow: false },
};

/**
 * Painel executivo do Administrador.
 *
 * @metodo Correção do Administrador §1 — acesso global e governança, não responsabilidade operacional
 * @metodo Correção do Administrador §5 — executivo e operacional, nunca só uma lista de registros
 *
 * O Administrador enxerga tudo. Isso não faz dele o dono de nenhum Case — por
 * isso o painel mostra a operação em números e apontamentos, e não uma fila de
 * trabalho dele. Onde há alguém parado ou faltando responsável, o painel diz;
 * quem age é o nível certo.
 */

function formatMetric(value: Metric, suffix = ""): string {
  if (value === null) return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("pt-BR")}${suffix}`;
}

function StatCard({
  label,
  value,
  suffix,
  href,
  emphasis,
}: {
  label: string;
  value: Metric;
  suffix?: string;
  href?: string;
  /** Números que pedem ação quando existem — ênfase por peso, nunca por alarme. */
  emphasis?: boolean;
}) {
  const unavailable = value === null;
  const alerta = emphasis && typeof value === "number" && value > 0;
  /**
   * Zero é ausência, e ausência não merece o peso de um número.
   *
   * A Visão geral abria com doze indicadores no mesmo corpo escuro e no mesmo
   * peso — e, numa operação em repouso, isso são doze zeros gigantes. O olho
   * percorria doze vezes o nada antes de encontrar qualquer coisa que
   * exigisse ação: hierarquia exatamente invertida para uma tela cuja função
   * é dizer onde agir agora.
   *
   * O zero continua inteiro e legível — a operação precisa saber que é zero,
   * e esconder ausência é como se fabrica um dado que ninguém confere. Ele só
   * recua de peso, para que o primeiro ponto de atenção volte a ser o que tem
   * algo a dizer.
   */
  const zerado = value === 0;

  const content = (
    <Card padding="lg" className="h-full">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={`mt-1 font-serif ${
          unavailable || zerado
            ? "text-2xl font-normal text-ink-muted"
            : alerta
              ? "text-3xl font-semibold text-brand-gold"
              : "text-3xl font-semibold text-brand-primary-deep"
        }`}
      >
        {formatMetric(value, suffix)}
      </p>
      {unavailable ? <p className="mt-0.5 text-xs text-ink-muted">Informação indisponível</p> : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const state = await requireRole("administrador");
  const { periodo } = await searchParams;
  const period: PeriodKey = (PERIODS.find((p) => p.key === periodo)?.key ?? "30d") as PeriodKey;

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();
  const now = new Date();

  const [source, professionals, teamMembers, recentActivity] = await Promise.all([
    loadDashboardSource(regularClient),
    listProfessionalProfiles(regularClient),
    listTeamMembers(regularClient, adminClient),
    listRecentAuditLogs(regularClient, 8),
  ]);

  const indicators = computeIndicators(source, period, now);
  const funnel = buildFunnel(source, period, now);
  const porResponsavel = casesByRole(source);
  const porEtapa = casesByStatus(source)?.map((s) => ({
    ...s,
    label: CASE_STATUS_LABELS[s.label as CaseStatus] ?? s.label,
  }));
  const porOrigem = leadsBySource(source, period, now);
  const serie = buildTimeSeries(source, period, now);

  // Indicador é sobre a Rede real. Demonstração e fixture de certificação
  // existem para exercitar telas e contratos; contá-las aqui faria o
  // Administrador ver trabalho pendente que não existe — e, pior, faria a
  // Rede parecer maior do que é.
  const pendingPublication = professionals.filter(
    (professional) =>
      professional.status === "ativo" &&
      professional.publicationStatus === "nao_publicado" &&
      !professional.isDemo &&
      !professional.isTestFixture,
  );

  // Papéis contados por PESSOA, não por concessão. Alguém que acumula
  // Curador e Concierge aparece nos dois — e é justamente isso que o
  // Administrador precisa enxergar para corrigir.
  const porPapel = (["atendente", "curador_medico", "concierge", "administrador"] as const).map((slug) => ({
    slug,
    label: { atendente: "Atendente", curador_medico: "Curador", concierge: "Concierge", administrador: "Administrador" }[
      slug
    ],
    count: teamMembers.filter((m) => m.roles.includes(slug)).length,
  }));
  const acumulamNiveis = teamMembers.filter(
    (m) => ["atendente", "curador_medico", "concierge"].filter((r) => m.roles.includes(r)).length > 1,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-ink">
            Olá, {state.profile?.displayName ?? "Administrador"}
          </h1>
          <p className="text-sm text-ink-muted">Visão executiva da operação da Aliviar.</p>
        </div>

        <nav aria-label="Período dos indicadores" className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin?periodo=${p.key}`}
              aria-current={p.key === period ? "page" : undefined}
              className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                p.key === period
                  ? "bg-brand-primary text-white"
                  : "border border-border text-ink-muted hover:text-ink"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ONE ALIVIAR, Problema 5: a Home responde "onde preciso agir agora?"
          — os números que doem vêm primeiro; aquisição e estatística, depois. */}
      <section aria-labelledby="pendencias">
        <h2 id="pendencias" className="mb-2 text-sm font-semibold text-ink-muted">
          Onde agir agora
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Primeiro do bloco: quem já contou a própria história e ainda não
              tem Case é a espera mais silenciosa da operação — a pessoa fez a
              parte dela, e nenhum outro indicador desta tela a enxerga. */}
          <StatCard
            label="Histórias aguardando Case"
            value={indicators.historiasAguardandoCase}
            href="/admin/pacientes"
            emphasis
          />
          <StatCard label="Sem responsável" value={indicators.casesSemResponsavel} href="/admin/casos" emphasis />
          <StatCard label="Cases atrasados" value={indicators.casesAtrasados} emphasis />
          <StatCard label="Tarefas vencidas" value={indicators.tarefasVencidas} emphasis />
          <StatCard label="Compromissos em 7 dias" value={indicators.compromissosProximos} />
        </div>
      </section>

      <section aria-labelledby="operacao">
        <h2 id="operacao" className="mb-2 text-sm font-semibold text-ink-muted">
          Operação
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cases abertos" value={indicators.casesAbertos} href="/admin/casos" />
          <StatCard label="Com o Concierge" value={indicators.casesNoConcierge} />
          <StatCard label="Concluídos" value={indicators.casesConcluidos} />
          <StatCard label="Documentos pendentes" value={indicators.documentosPendentes} />
        </div>
      </section>

      <section aria-labelledby="aquisicao">
        <h2 id="aquisicao" className="mb-2 text-sm font-semibold text-ink-muted">
          Aquisição
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leads novos" value={indicators.leadsNovos} />
          <StatCard label="Em qualificação" value={indicators.leadsEmQualificacao} />
          <StatCard label="Conversão lead → paciente" value={indicators.taxaConversaoLead} suffix="%" />
          <StatCard label="Pacientes ativos" value={indicators.pacientesAtivos} href="/admin/pacientes" />
        </div>
      </section>

      <section aria-labelledby="tempos">
        <h2 id="tempos" className="mb-2 text-sm font-semibold text-ink-muted">
          Tempo médio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Do lead até virar paciente" value={indicators.tempoMedioAteAberturaHoras} suffix=" h" />
          <StatCard label="De Curadoria até o Concierge" value={indicators.tempoMedioCuradoriaHoras} suffix=" h" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelChart steps={funnel} />
        <TrendChart points={serie} />
        <BarsChart
          title="Cases por responsável"
          question="A carga está distribuída entre os três níveis, ou concentrada em alguém?"
          unit="Cases abertos"
          slices={porResponsavel}
        />
        <BarsChart
          title="Cases por etapa"
          question="Em que etapa os Cases estão empilhando?"
          unit="Cases"
          slices={porEtapa ?? null}
        />
        <BarsChart
          title="Origem dos leads"
          question="Qual canal traz gente de verdade?"
          unit="leads"
          slices={porOrigem}
        />

        <section className="min-w-0 rounded-lg border border-border bg-surface p-4" aria-labelledby="papeis-titulo">
          <h3 id="papeis-titulo" className="text-sm font-semibold text-ink">
            Pessoas por papel
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">A operação tem gente em cada nível?</p>

          <ul className="mt-3 space-y-1.5">
            {porPapel.map((papel) => (
              <li key={papel.slug} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">{papel.label}</span>
                <span className={`tabular-nums ${papel.count === 0 ? "text-brand-gold" : "text-ink"}`}>{papel.count}</span>
              </li>
            ))}
          </ul>

          {acumulamNiveis.length > 0 ? (
            <p className="mt-3 rounded-md border border-warning bg-warning-surface px-3 py-2 text-xs text-ink">
              {acumulamNiveis.length === 1 ? "Uma pessoa acumula" : `${acumulamNiveis.length} pessoas acumulam`} mais de
              um nível operacional. O Case passa de nível sem trocar de gente — a separação entre Atendente, Curador e
              Concierge existe no sistema, mas não na prática.
            </p>
          ) : null}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Pendências</h2>
            <p className="text-sm text-ink-muted">Profissionais ativos aguardando decisão de publicação.</p>
          </CardHeader>

          {pendingPublication.length === 0 ? (
            <EmptyState
              title="Nenhuma pendência no momento."
              description="Todos os profissionais ativos já têm uma decisão de publicação registrada."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pendingPublication.map((professional) => (
                <li key={professional.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-ink">{professional.displayName}</span>
                  <Link
                    href={`/admin/profissionais/${professional.id}`}
                    className="font-medium text-brand-primary hover:text-brand-primary-deep"
                  >
                    Revisar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-sans text-lg font-semibold text-ink">Atividade recente</h2>
            <p className="text-sm text-ink-muted">Últimas concessões e revogações de papel.</p>
          </CardHeader>

          <AuditLogList entries={recentActivity} emptyMessage="Ainda não há atividade registrada." showTarget />
        </Card>
      </div>
    </div>
  );
}
