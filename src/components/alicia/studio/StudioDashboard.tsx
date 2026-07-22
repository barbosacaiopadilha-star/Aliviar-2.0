"use client";

import { useStudio } from "./StudioProvider";
import { STUDIO_STATUS_LABELS } from "@/alicia/studio/types";

export function StudioDashboard() {
  const { metrics, state, resetToSeed } = useStudio();

  return (
    <div className="space-y-8" data-testid="studio-dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Indicadores operacionais do catálogo em produção
          </p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={resetToSeed}>
          Restaurar dados demo
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Backlog" value={String(metrics.backlog)} hint="Não publicados" />
        <MetricCard label="Nível A" value={String(metrics.nivelA)} hint="Formação majoritariamente confirmada" />
        <MetricCard label="Nível B" value={String(metrics.nivelB)} hint="Com campos em verificação" />
        <MetricCard
          label="Pendências"
          value={String(metrics.pendencies)}
          hint="Campos aguardando verificação"
        />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Tempo médio até publicação</h2>
        <p className="mt-2 font-serif text-3xl font-semibold text-ink">
          {metrics.averageDaysToPublish === null
            ? "—"
            : `${metrics.averageDaysToPublish.toFixed(1)} dias`}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Calculado a partir de casos com data de publicação registrada no Studio.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Distribuição por status</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(metrics.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2"
            >
              <span className="text-sm text-ink-soft">
                {STUDIO_STATUS_LABELS[status as keyof typeof STUDIO_STATUS_LABELS]}
              </span>
              <span className="font-semibold text-ink">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Casos recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft">
                <th className="pb-2 pr-4 font-medium">Caso</th>
                <th className="pb-2 pr-4 font-medium">Nome</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Nível</th>
              </tr>
            </thead>
            <tbody>
              {state.candidates.slice(0, 6).map((candidate) => (
                <tr key={candidate.id} className="border-b border-line/60">
                  <td className="py-2 pr-4 font-mono text-xs">{candidate.caseId}</td>
                  <td className="py-2 pr-4">{candidate.name}</td>
                  <td className="py-2 pr-4">{STUDIO_STATUS_LABELS[candidate.status]}</td>
                  <td className="py-2">{candidate.nivel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </div>
  );
}
