"use client";

import type { EvidenceExplorerSnapshot } from "@/alicia/evidence-acquisition";

type EvidenceExplorerProps = {
  snapshot: EvidenceExplorerSnapshot;
};

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export function EvidenceExplorer({ snapshot }: EvidenceExplorerProps) {
  return (
    <div className="space-y-8" data-testid="evidence-explorer">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Evidence Explorer</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — evidências, fontes, conflitos, proveniência e cobertura.
        </p>
        {snapshot.lastRunAt && (
          <p className="mt-1 text-xs text-ink-soft">
            Última aquisição: {new Date(snapshot.lastRunAt).toLocaleString("pt-BR")}
            {snapshot.connectorRunId && ` · Run ${snapshot.connectorRunId}`}
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Packages" value={snapshot.packages.length} />
        <MetricCard label="Criados" value={snapshot.metrics.packagesCreated} />
        <MetricCard label="Conflitos" value={snapshot.metrics.conflictsDetected} />
        <MetricCard
          label="Cobertura média"
          value={`${snapshot.metrics.averageCoverage}%`}
        />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Evidence Packages</h2>
        {snapshot.packages.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhum package gerado.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {snapshot.packages.map((pkg) => (
              <li
                key={pkg.packageId}
                className="rounded-lg border border-line p-4"
                data-testid="evidence-package-item"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {pkg.identity.nome ?? pkg.candidateId}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {pkg.packageId} · v{pkg.metadata.version} · {pkg.metadata.sourceCount}{" "}
                      fonte(s)
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-ink">
                      {pkg.conflicts.length > 0 ? (
                        <span className="text-amber-600">
                          {pkg.conflicts.length} conflito(s)
                        </span>
                      ) : (
                        <span className="text-sage">Sem conflitos</span>
                      )}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid gap-2 text-xs text-ink-soft sm:grid-cols-3">
                  <div>
                    <dt>CRM</dt>
                    <dd className="font-medium text-ink">
                      {pkg.identity.crm
                        ? `CRM-${pkg.identity.crmUf} ${pkg.identity.crm}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Especialidade</dt>
                    <dd className="font-medium text-ink">
                      {pkg.specialties[0]?.primary ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Local</dt>
                    <dd className="font-medium text-ink">
                      {pkg.practiceLocations[0]
                        ? `${pkg.practiceLocations[0].city}, ${pkg.practiceLocations[0].state}`
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <p className="text-xs font-medium text-ink-soft">Cobertura</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {pkg.coverage.map((item) => (
                      <span
                        key={item.section}
                        className="rounded bg-paper px-2 py-1 text-xs text-ink"
                      >
                        {item.section}: {item.percentage}%
                      </span>
                    ))}
                  </div>
                </div>

                {pkg.conflicts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-amber-600">Conflitos</p>
                    <ul className="mt-1 space-y-1">
                      {pkg.conflicts.map((conflict) => (
                        <li key={conflict.id} className="text-xs text-ink-soft">
                          {conflict.type} — {conflict.field}:{" "}
                          {conflict.values.map((v) => v.value).join(" vs ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3">
                  <p className="text-xs font-medium text-ink-soft">
                    Proveniência ({pkg.evidence.length} evidência(s))
                  </p>
                  <ul className="mt-1 space-y-1">
                    {pkg.evidence.slice(0, 5).map((item) => (
                      <li key={item.id} className="text-xs text-ink-soft">
                        {item.field}: {item.value} —{" "}
                        {item.provenance.map((p) => p.sourceName).join(", ")}
                      </li>
                    ))}
                    {pkg.evidence.length > 5 && (
                      <li className="text-xs text-ink-soft">
                        +{pkg.evidence.length - 5} mais…
                      </li>
                    )}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Histórico</h2>
        {snapshot.history.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nenhum evento registrado.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {snapshot.history.slice(-20).reverse().map((entry, index) => (
              <li
                key={`${entry.packageId}-${entry.timestamp}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-ink">
                  {entry.action} — {entry.candidateId}
                </span>
                <span className="text-xs text-ink-soft">
                  {new Date(entry.timestamp).toLocaleString("pt-BR")} · cobertura{" "}
                  {entry.coverageAverage}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
