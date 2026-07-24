"use client";

import type { DiscoveryInboxSnapshot } from "@/alicia/discovery/studio-adapter";
import type { DiscoveryQueueStatus } from "@/alicia/discovery";

const STATUS_LABELS: Record<DiscoveryQueueStatus, string> = {
  DISCOVERED: "Descoberto",
  READY_FOR_EVIDENCE: "Pronto para Evidence",
  IGNORED: "Ignorado",
  DUPLICATE: "Duplicado",
};

const STATUS_COLORS: Record<DiscoveryQueueStatus, string> = {
  DISCOVERED: "border-blue-300 bg-blue-50",
  READY_FOR_EVIDENCE: "border-sage bg-sage-soft",
  IGNORED: "border-line bg-paper",
  DUPLICATE: "border-amber-300 bg-amber-50",
};

type DiscoveryInboxProps = {
  snapshot: DiscoveryInboxSnapshot;
};

export function DiscoveryInbox({ snapshot }: DiscoveryInboxProps) {
  const readyCount = snapshot.items.filter((item) => item.status === "READY_FOR_EVIDENCE").length;
  const duplicateCount = snapshot.items.filter((item) => item.status === "DUPLICATE").length;

  return (
    <div className="space-y-8" data-testid="discovery-inbox">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Discovery Inbox</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — candidatos descobertos automaticamente, sem coleta de evidências.
        </p>
        {snapshot.lastRunAt && (
          <p className="mt-1 text-xs text-ink-soft">
            Última execução: {new Date(snapshot.lastRunAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Encontrados" value={snapshot.metrics.candidatesFound} />
        <MetricCard label="Prontos p/ Evidence" value={readyCount} />
        <MetricCard label="Duplicados" value={duplicateCount} />
        <MetricCard label="Fontes executadas" value={snapshot.metrics.sourcesExecuted} />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Saúde das fontes</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(snapshot.sourceHealth).map(([sourceId, health]) => (
            <li key={sourceId} className="rounded-lg border border-line px-3 py-2 text-sm">
              <span className="font-medium text-ink">{sourceId}</span>
              <span className="ml-2 text-ink-soft">{health}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Candidatos descobertos</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {snapshot.items.length} item(ns) na fila · tempo médio{" "}
          {snapshot.metrics.averageDurationMs}ms
        </p>
        <ul className="mt-4 space-y-3">
          {snapshot.items.length === 0 ? (
            <li className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
              Nenhum candidato descoberto.
            </li>
          ) : (
            snapshot.items.map((item) => (
              <li
                key={item.queueId}
                className={`rounded-lg border p-4 ${STATUS_COLORS[item.status]}`}
                data-testid="discovery-inbox-item"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{item.candidate.nome}</p>
                    <p className="text-xs text-ink-soft">{item.candidate.candidateId}</p>
                  </div>
                  <span className="rounded-full bg-paper-raised px-2 py-0.5 text-xs font-semibold text-ink">
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {item.candidate.especialidade} · {item.candidate.cidade}/{item.candidate.estado}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  CRM {item.candidate.crmUf} {item.candidate.crm || "—"} · confiança{" "}
                  {Math.round(item.candidate.confidence * 100)}%
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Fontes: {item.candidate.fontesEncontradas.join(", ")}
                </p>
                {item.duplicateOf && (
                  <p className="mt-1 text-xs text-coral">Duplicata de {item.duplicateOf}</p>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
