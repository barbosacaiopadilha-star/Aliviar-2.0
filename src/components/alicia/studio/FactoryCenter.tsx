"use client";

import type { FactoryCenterSnapshot } from "@/alicia/factory";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "text-sage",
  RUNNING: "text-amber-600",
  FAILED: "text-coral",
  DRY_RUN: "text-ink-soft",
  PAUSED: "text-ink-soft",
};

type FactoryCenterProps = {
  snapshot: FactoryCenterSnapshot;
};

export function FactoryCenter({ snapshot }: FactoryCenterProps) {
  return (
    <div className="space-y-8" data-testid="factory-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Factory</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — execuções automatizadas da cadeia completa.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Scheduler: {snapshot.scheduler.schedule}
          {snapshot.scheduler.nextRunAt &&
            ` · Próxima: ${new Date(snapshot.scheduler.nextRunAt).toLocaleString("pt-BR")}`}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Runs" value={snapshot.metrics.totalRuns} />
        <MetricCard label="Publicados" value={snapshot.metrics.profilesPublished} />
        <MetricCard label="Review Cases" value={snapshot.metrics.reviewCases} />
        <MetricCard
          label="Tempo médio"
          value={`${snapshot.metrics.averageDurationMs}ms`}
        />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Últimos Runs</h2>
        {snapshot.runs.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhum run executado.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {snapshot.runs.slice(0, 10).map((run) => (
              <li
                key={run.runId}
                className="rounded-lg border border-line p-4"
                data-testid="factory-run-item"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{run.runId}</p>
                    <p className="text-xs text-ink-soft">
                      {run.schedule} · {run.dryRun ? "DRY RUN" : "PRODUÇÃO"} ·{" "}
                      {run.checkpoints.length} checkpoint(s)
                    </p>
                  </div>
                  <p className={`text-sm font-medium ${STATUS_COLORS[run.status] ?? "text-ink"}`}>
                    {run.status}
                  </p>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-ink-soft sm:grid-cols-4">
                  <div>
                    <dt>Candidatos</dt>
                    <dd className="font-medium text-ink">{run.candidatesFound}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd className="font-medium text-ink">{run.evidencePackages}</dd>
                  </div>
                  <div>
                    <dt>Publicados</dt>
                    <dd className="font-medium text-ink">{run.published}</dd>
                  </div>
                  <div>
                    <dt>Duração</dt>
                    <dd className="font-medium text-ink">
                      {run.durationMs ? `${run.durationMs}ms` : "—"}
                    </dd>
                  </div>
                </dl>
                {run.errors.length > 0 && (
                  <p className="mt-2 text-xs text-coral">
                    {run.errors.length} erro(s) — falha isolada por candidato
                  </p>
                )}
                {run.reviewCases > 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    {run.reviewCases} review case(s) — intervenção humana necessária
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {snapshot.lastReport && (
        <section className="card p-6">
          <h2 className="text-sm font-semibold text-ink">Último Relatório</h2>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Review Rate</dt>
              <dd>{(snapshot.lastReport.reviewRate * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Publication Rate</dt>
              <dd>{(snapshot.lastReport.publicationRate * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Falhas</dt>
              <dd>{snapshot.lastReport.kpis.failures}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Warnings</dt>
              <dd>{snapshot.lastReport.kpis.warnings}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
