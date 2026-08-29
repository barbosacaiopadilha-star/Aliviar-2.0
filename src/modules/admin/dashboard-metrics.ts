// Indicadores executivos do Administrador.
//
// @metodo Correção do Administrador §5 — dashboard executivo, não lista de registros
// @metodo Correção do Administrador §7 — cada gráfico responde uma pergunta de negócio
//
// Módulo puro: recebe linhas cruas, devolve números. Nenhuma consulta aqui.
// Isso existe para que o dashboard seja testável sem banco — e para que
// "métrica sem fonte real" seja impossível: se o dado não chegou, o tipo diz
// `null`, e a tela mostra indisponível em vez de zero.

import { normalizeLeadSource, type LeadSource } from "@/modules/crm/lead";
import type { ResponsibleRole } from "@/modules/cases/responsibility";
import { RESPONSIBLE_ROLES } from "@/modules/cases/responsibility";

/**
 * A diferença entre "zero" e "não sei" é a diferença entre um dashboard
 * honesto e um que mente. `null` significa que a fonte não respondeu — a tela
 * mostra "indisponível", nunca 0.
 */
export type Metric = number | null;

export type PeriodKey = "7d" | "30d" | "90d" | "tudo";

export const PERIODS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null },
];

export function periodStart(period: PeriodKey, now: Date): Date | null {
  const days = PERIODS.find((p) => p.key === period)?.days ?? null;
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function withinPeriod(iso: string | null, start: Date | null): boolean {
  if (start === null) return true;
  if (iso === null) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= start.getTime();
}

// ---------------------------------------------------------------------------
// Entradas
// ---------------------------------------------------------------------------

export type LeadRow = {
  id: string;
  source: string | null;
  createdAt: string;
  qualifiedAt: string | null;
  convertedAt: string | null;
  patientProfileId: string | null;
  archivedAt: string | null;
};

export type CaseRow = {
  id: string;
  status: string;
  responsibleRole: ResponsibleRole | null;
  responsibleId: string | null;
  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;
  /** Quando o Case saiu para o Concierge. Nulo se ainda não saiu. */
  handedToConciergeAt: string | null;
};

export type TaskRow = { id: string; dueAt: string | null; completedAt: string | null };
export type AppointmentRow = { id: string; startsAt: string };
export type PatientRow = { id: string; status: string };
export type TeamRow = { id: string; roles: readonly string[] };

/**
 * Uma história enviada pela paciente. Ao painel interessa o intervalo em que
 * ela JÁ contou o que vive e ainda não existe Case aberto em nome dela — o
 * único momento da jornada em que a espera é invisível para a operação.
 */
export type StoryRow = { id: string; submittedAt: string | null; hasCase: boolean };

export type DashboardSource = {
  leads: readonly LeadRow[] | null;
  cases: readonly CaseRow[] | null;
  tasks: readonly TaskRow[] | null;
  appointments: readonly AppointmentRow[] | null;
  patients: readonly PatientRow[] | null;
  team: readonly TeamRow[] | null;
  stories: readonly StoryRow[] | null;
  pendingDocuments: number | null;
};

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------

const CLOSED_STATUSES = ["CLOSED", "CANCELLED", "DELIVERED"];

/** Um Case parado há mais de 14 dias sem fechar. O número é operacional, não teórico. */
const STALE_CASE_DAYS = 14;

export type DashboardIndicators = {
  leadsNovos: Metric;
  leadsEmQualificacao: Metric;
  taxaConversaoLead: Metric;
  /**
   * Quantos leads sustentam a taxa acima.
   *
   * A taxa sozinha mente por omissão: com um único lead convertido, o cartão
   * anunciava "100%" — verdade aritmética que se lê como afirmação sobre a
   * operação. O denominador vai junto para que 100% seja lido como "1 de 1".
   */
  leadsTotalNoPeriodo: Metric;
  pacientesAtivos: Metric;
  casesAbertos: Metric;
  casesSemResponsavel: Metric;
  casesNoConcierge: Metric;
  casesConcluidos: Metric;
  casesAtrasados: Metric;
  historiasAguardandoCase: Metric;
  tarefasVencidas: Metric;
  compromissosProximos: Metric;
  documentosPendentes: Metric;
  tempoMedioAteAberturaHoras: Metric;
  tempoMedioCuradoriaHoras: Metric;
};

function mean(values: number[]): Metric {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function hoursBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return (b - a) / 36e5;
}

export function computeIndicators(source: DashboardSource, period: PeriodKey, now: Date): DashboardIndicators {
  const start = periodStart(period, now);
  const leads = source.leads?.filter((l) => withinPeriod(l.createdAt, start) && l.archivedAt === null) ?? null;
  const cases = source.cases?.filter((c) => withinPeriod(c.createdAt, start)) ?? null;

  const convertidos = leads?.filter((l) => l.convertedAt !== null).length ?? null;

  return {
    leadsNovos: leads?.filter((l) => l.qualifiedAt === null && l.convertedAt === null).length ?? null,
    leadsEmQualificacao: leads?.filter((l) => l.qualifiedAt !== null && l.convertedAt === null).length ?? null,

    // Taxa só existe se houve lead. Dividir por zero e mostrar 0% seria dizer
    // "convertemos nada" quando a verdade é "não chegou ninguém".
    taxaConversaoLead:
      leads === null || convertidos === null ? null : leads.length === 0 ? null : (convertidos / leads.length) * 100,

    leadsTotalNoPeriodo: leads?.length ?? null,

    pacientesAtivos: source.patients?.filter((p) => p.status === "ativo").length ?? null,

    casesAbertos: cases?.filter((c) => !CLOSED_STATUSES.includes(c.status)).length ?? null,
    casesSemResponsavel: cases?.filter((c) => c.responsibleId === null && !CLOSED_STATUSES.includes(c.status)).length ?? null,
    casesNoConcierge: cases?.filter((c) => c.responsibleRole === "concierge").length ?? null,
    casesConcluidos: cases?.filter((c) => c.status === "CLOSED").length ?? null,

    casesAtrasados:
      cases?.filter((c) => {
        if (CLOSED_STATUSES.includes(c.status)) return false;
        const idle = hoursBetween(c.createdAt, now.toISOString());
        return idle !== null && idle > STALE_CASE_DAYS * 24;
      }).length ?? null,

    // Uma história enviada sem Case é uma pessoa que já contou o que vive e
    // não tem ninguém trabalhando por ela. Nenhum outro indicador a alcança:
    // ela não é lead (já tem conta) e ainda não é Case. Fora do recorte de
    // período de propósito — a espera não deixa de existir porque envelheceu.
    historiasAguardandoCase:
      source.stories?.filter((s) => !s.hasCase).length ?? null,

    tarefasVencidas:
      source.tasks?.filter((t) => t.completedAt === null && t.dueAt !== null && Date.parse(t.dueAt) < now.getTime())
        .length ?? null,

    compromissosProximos:
      source.appointments?.filter((a) => {
        const t = Date.parse(a.startsAt);
        return Number.isFinite(t) && t >= now.getTime() && t <= now.getTime() + 7 * 24 * 36e5;
      }).length ?? null,

    documentosPendentes: source.pendingDocuments,

    tempoMedioAteAberturaHoras: leads
      ? mean(
          leads
            .map((l) => hoursBetween(l.createdAt, l.convertedAt))
            .filter((v): v is number => v !== null),
        )
      : null,

    tempoMedioCuradoriaHoras: cases
      ? mean(
          cases
            .map((c) => hoursBetween(c.startedAt, c.handedToConciergeAt))
            .filter((v): v is number => v !== null),
        )
      : null,
  };
}

// ---------------------------------------------------------------------------
// Gráficos
// ---------------------------------------------------------------------------

export type FunnelStep = { label: string; value: number };

/**
 * Funil operacional — responde: **onde a operação está perdendo gente?**
 *
 * Cada degrau é um subconjunto do anterior, então o funil só encolhe. Se um
 * degrau crescer, é sinal de dado inconsistente, não de sucesso.
 */
export function buildFunnel(source: DashboardSource, period: PeriodKey, now: Date): FunnelStep[] | null {
  const start = periodStart(period, now);
  if (source.leads === null || source.cases === null) return null;

  const leads = source.leads.filter((l) => withinPeriod(l.createdAt, start));
  const cases = source.cases.filter((c) => withinPeriod(c.createdAt, start));

  return [
    { label: "Lead", value: leads.length },
    { label: "Qualificado", value: leads.filter((l) => l.qualifiedAt !== null).length },
    { label: "Paciente criado", value: leads.filter((l) => l.patientProfileId !== null).length },
    { label: "Case aberto", value: cases.length },
    { label: "Em Curadoria", value: cases.filter((c) => c.responsibleRole === "curador_medico").length },
    { label: "Em acompanhamento", value: cases.filter((c) => c.responsibleRole === "concierge").length },
    { label: "Concluído", value: cases.filter((c) => c.status === "CLOSED").length },
  ];
}

export type Slice = { label: string; value: number };

/** Cases por responsável — responde: **a carga está distribuída?** */
export function casesByRole(source: DashboardSource): Slice[] | null {
  if (source.cases === null) return null;
  const open = source.cases.filter((c) => !CLOSED_STATUSES.includes(c.status));
  const labels: Record<ResponsibleRole, string> = {
    atendente: "Supervisor",
    curador_medico: "Curador",
    concierge: "Concierge",
  };
  return [
    ...RESPONSIBLE_ROLES.map((role) => ({
      label: labels[role],
      value: open.filter((c) => c.responsibleRole === role).length,
    })),
    // Aparece sempre, mesmo em zero: é o número que precisa doer quando cresce.
    { label: "Sem responsável", value: open.filter((c) => c.responsibleRole === null).length },
  ];
}

/** Cases por etapa — responde: **onde os Cases estão empilhando?** */
export function casesByStatus(source: DashboardSource): Slice[] | null {
  if (source.cases === null) return null;
  const counts = new Map<string, number>();
  for (const c of source.cases) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/** Origem dos leads — responde: **qual canal traz gente de verdade?** */
export function leadsBySource(source: DashboardSource, period: PeriodKey, now: Date): Slice[] | null {
  if (source.leads === null) return null;
  const start = periodStart(period, now);
  const counts = new Map<LeadSource, number>();
  for (const l of source.leads) {
    if (!withinPeriod(l.createdAt, start)) continue;
    const s = normalizeLeadSource(l.source);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export type SeriesPoint = { date: string; leads: number; convertidos: number; casesAbertos: number; casesConcluidos: number };

/** Evolução temporal — responde: **estamos melhorando ou piorando?** */
export function buildTimeSeries(source: DashboardSource, period: PeriodKey, now: Date): SeriesPoint[] | null {
  if (source.leads === null || source.cases === null) return null;

  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;
  const buckets = new Map<string, SeriesPoint>();
  const dayKey = (iso: string) => iso.slice(0, 10);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 36e5).toISOString().slice(0, 10);
    buckets.set(d, { date: d, leads: 0, convertidos: 0, casesAbertos: 0, casesConcluidos: 0 });
  }

  const bump = (iso: string | null, field: keyof Omit<SeriesPoint, "date">) => {
    if (!iso) return;
    const b = buckets.get(dayKey(iso));
    if (b) b[field] += 1;
  };

  for (const l of source.leads) {
    bump(l.createdAt, "leads");
    bump(l.convertedAt, "convertidos");
  }
  for (const c of source.cases) {
    bump(c.createdAt, "casesAbertos");
    bump(c.closedAt, "casesConcluidos");
  }

  return [...buckets.values()];
}

/** Um gráfico sem dado não deve desenhar nada — deve dizer que não há nada. */
export function isEmpty(slices: readonly { value: number }[] | null): boolean {
  return slices === null || slices.every((s) => s.value === 0);
}
