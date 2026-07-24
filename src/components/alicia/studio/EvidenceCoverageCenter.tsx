"use client";

import type { EvidenceCoverageSnapshot } from "@/alicia/evidence-coverage";

type EvidenceCoverageCenterProps = {
  snapshot: EvidenceCoverageSnapshot;
};

export function EvidenceCoverageCenter({ snapshot }: EvidenceCoverageCenterProps) {
  return (
    <div className="space-y-8" data-testid="evidence-coverage-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Evidence Coverage</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — lacunas de evidência e plano de aquisição por candidato.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cobertura média" value={`${snapshot.kpis.averageCoverage}%`} />
        <MetricCard label="Candidatos" value={snapshot.analyses.length} />
        <MetricCard
          label="A uma evidência"
          value={snapshot.kpis.oneEvidenceAwayCount}
        />
        <MetricCard
          label="Planos de coleta"
          value={snapshot.acquisitionPlan.entries.length}
        />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Cobertura por categoria</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(snapshot.kpis.byCategory).map(([category, pct]) => (
            <div key={category} className="rounded-lg border border-line p-3">
              <dt className="text-xs text-ink-soft">{category}</dt>
              <dd className="text-lg font-semibold text-ink">{pct}%</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Priorização</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.prioritized.map((item) => (
            <li
              key={item.candidateId}
              className="rounded-lg border border-line p-4"
              data-testid="coverage-candidate-item"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">
                    #{item.rank} {item.name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {item.specialty} · {item.city}
                  </p>
                </div>
                <p className="text-sm font-medium text-ink">{item.coveragePercent}%</p>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Faltantes: {item.missingCount} · Conflitos: {item.conflictCount}
                {item.oneEvidenceAway ? " · A uma evidência" : ""}
              </p>
              {item.suggestedConnectors.length > 0 && (
                <p className="mt-1 text-xs text-coral">
                  Conectores sugeridos: {item.suggestedConnectors.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Detalhe por candidato</h2>
        <ul className="mt-4 space-y-4">
          {snapshot.analyses.map((analysis) => (
            <li key={analysis.candidateId} className="rounded-lg border border-line p-4">
              <p className="font-medium text-ink">{analysis.name}</p>
              <p className="text-xs text-ink-soft">
                {analysis.specialty} · {analysis.city} · {analysis.coveragePercent}% cobertura
              </p>
              {analysis.missing.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-coral">Evidências ausentes</p>
                  <ul className="mt-1 text-xs text-ink-soft">
                    {analysis.missing.map((m) => (
                      <li key={m.category}>
                        {m.category}: {m.fields.join(", ") || "—"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.conflicting.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-amber-600">Conflitos</p>
                  <ul className="mt-1 text-xs text-ink-soft">
                    {analysis.conflicting.map((c) => (
                      <li key={`${c.field}-${c.conflictType}`}>
                        {c.category} / {c.conflictType}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Impacto estimado por conector</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          {snapshot.connectorImpact.map((impact) => (
            <li key={impact.connectorId}>
              <span className="font-medium text-ink">{impact.connectorId}</span>
              {" — "}+{impact.estimatedCoverageIncrease}% estimado ·{" "}
              {impact.candidatesHelped} candidato(s)
            </li>
          ))}
        </ul>
      </section>
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
