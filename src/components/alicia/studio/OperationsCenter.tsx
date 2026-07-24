import type { OperationsCenterSnapshot } from "@/alicia/operations";

type OperationsCenterProps = {
  snapshot: OperationsCenterSnapshot;
};

const STAGE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  evidence: "Evidence",
  protocol: "Protocol",
  publication: "Publication",
  verification: "Verification",
};

const HEALTH_COLORS = {
  healthy: "text-sage",
  degraded: "text-amber-600",
  critical: "text-coral",
} as const;

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export function OperationsCenter({ snapshot }: OperationsCenterProps) {
  return (
    <div className="space-y-8" data-testid="operations-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Operations Center</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — pipeline, KPIs, timeline, gargalos, alertas e health.
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Atualizado: {new Date(snapshot.lastRefreshedAt).toLocaleString("pt-BR")} · Health:{" "}
          <span className={HEALTH_COLORS[snapshot.health.overall]}>
            {snapshot.health.overall}
          </span>
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Candidatos" value={snapshot.kpis.candidatesFound} />
        <MetricCard label="Evidence Packages" value={snapshot.kpis.evidencePackages} />
        <MetricCard label="Review Cases" value={snapshot.kpis.reviewCases} />
        <MetricCard
          label="Disponibilidade Conectores"
          value={`${(snapshot.kpis.connectorAvailability * 100).toFixed(0)}%`}
        />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Pipeline Dashboard</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          {snapshot.dashboard.map((stage, index) => (
            <div key={stage.stage} className="flex items-center gap-2">
              {index > 0 && <span>↓</span>}
              <span className="rounded bg-paper px-2 py-1 font-medium text-ink">
                {STAGE_LABELS[stage.stage]}
              </span>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-3">
          {snapshot.dashboard.map((stage) => (
            <li
              key={stage.stage}
              className="rounded-lg border border-line p-4"
              data-testid="pipeline-stage"
            >
              <p className="font-medium text-ink">{STAGE_LABELS[stage.stage]}</p>
              <dl className="mt-2 grid gap-2 text-xs text-ink-soft sm:grid-cols-3 lg:grid-cols-6">
                <div>
                  <dt>Entrada</dt>
                  <dd className="font-medium text-ink">{stage.input}</dd>
                </div>
                <div>
                  <dt>Saída</dt>
                  <dd className="font-medium text-ink">{stage.output}</dd>
                </div>
                <div>
                  <dt>Latência média</dt>
                  <dd className="font-medium text-ink">{stage.averageLatencyMs}ms</dd>
                </div>
                <div>
                  <dt>Taxa sucesso</dt>
                  <dd className="font-medium text-ink">
                    {(stage.successRate * 100).toFixed(0)}%
                  </dd>
                </div>
                <div>
                  <dt>Fila</dt>
                  <dd className="font-medium text-ink">{stage.queueSize}</dd>
                </div>
                <div>
                  <dt>Falhas</dt>
                  <dd className="font-medium text-ink">{stage.failures}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink">Analytics</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Latência total</dt>
              <dd className="font-medium text-ink">{snapshot.analytics.totalLatencyMs}ms</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">P95</dt>
              <dd className="font-medium text-ink">{snapshot.analytics.p95LatencyMs}ms</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">P99</dt>
              <dd className="font-medium text-ink">{snapshot.analytics.p99LatencyMs}ms</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Throughput/h</dt>
              <dd className="font-medium text-ink">{snapshot.analytics.throughputPerHour}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Backlog</dt>
              <dd className="font-medium text-ink">{snapshot.analytics.backlog}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Review Rate</dt>
              <dd className="font-medium text-ink">
                {(snapshot.analytics.reviewRate * 100).toFixed(1)}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Publication Rate</dt>
              <dd className="font-medium text-ink">
                {(snapshot.analytics.publicationRate * 100).toFixed(1)}%
              </dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink">KPIs Diários</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Protocol Approved</dt>
              <dd>{snapshot.kpis.protocolApproved}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Protocol Rejected</dt>
              <dd>{snapshot.kpis.protocolRejected}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Profiles Published</dt>
              <dd>{snapshot.kpis.profilesPublished}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Profiles Updated</dt>
              <dd>{snapshot.kpis.profilesUpdated}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Profiles Reverified</dt>
              <dd>{snapshot.kpis.profilesReverified}</dd>
            </div>
          </dl>
        </div>
      </section>

      {snapshot.bottlenecks.length > 0 && (
        <section className="card p-6">
          <h2 className="text-sm font-semibold text-amber-600">Bottlenecks</h2>
          <ul className="mt-4 space-y-2">
            {snapshot.bottlenecks.map((bn) => (
              <li key={bn.id} className="text-sm text-ink-soft">
                <span className="font-medium text-ink">[{bn.severity}]</span> {bn.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot.alerts.length > 0 && (
        <section className="card p-6">
          <h2 className="text-sm font-semibold text-coral">Alertas</h2>
          <ul className="mt-4 space-y-2">
            {snapshot.alerts.map((alert) => (
              <li key={alert.id} className="text-sm text-ink-soft">
                <span className="font-medium text-ink">[{alert.type}]</span> {alert.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Operational Timeline</h2>
        {snapshot.timelines.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhuma jornada reconstruída.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {snapshot.timelines.slice(0, 5).map((timeline) => (
              <li key={timeline.correlationId} className="rounded-lg border border-line p-3">
                <p className="text-sm font-medium text-ink">
                  {timeline.candidateId ?? timeline.correlationId}
                </p>
                <p className="text-xs text-ink-soft">
                  {timeline.stages.map((s) => STAGE_LABELS[s.stage]).join(" → ")} ·{" "}
                  {timeline.totalDurationMs}ms
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Histórico Diário</h2>
        <ul className="mt-4 space-y-2">
          {snapshot.history.map((entry) => (
            <li key={entry.date} className="flex justify-between text-sm">
              <span className="text-ink">{entry.date}</span>
              <span className="text-ink-soft">
                {entry.kpis.candidatesFound} candidatos · cobertura review{" "}
                {(entry.reviewRate * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
