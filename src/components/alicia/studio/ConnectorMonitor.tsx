"use client";

import type { ConnectorMonitorSnapshot } from "@/alicia/connectors";
import type { ConnectorHealthStatus } from "@/alicia/connectors";

const HEALTH_COLORS: Record<ConnectorHealthStatus, string> = {
  ONLINE: "text-sage",
  DEGRADED: "text-amber-600",
  OFFLINE: "text-coral",
  MAINTENANCE: "text-ink-soft",
  UNKNOWN: "text-ink-soft",
};

const HEALTH_LABELS: Record<ConnectorHealthStatus, string> = {
  ONLINE: "Online",
  DEGRADED: "Degradado",
  OFFLINE: "Offline",
  MAINTENANCE: "Manutenção",
  UNKNOWN: "Desconhecido",
};

type ConnectorMonitorProps = {
  snapshot: ConnectorMonitorSnapshot;
};

export function ConnectorMonitor({ snapshot }: ConnectorMonitorProps) {
  return (
    <div className="space-y-8" data-testid="connector-monitor">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Connector Monitor</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — conectores, health, latência, sincronização e fila de retries.
        </p>
        {snapshot.lastRunAt && (
          <p className="mt-1 text-xs text-ink-soft">
            Última sincronização: {new Date(snapshot.lastRunAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Execuções" value={snapshot.metrics.totalExecutions} />
        <MetricCard label="Sucesso" value={snapshot.metrics.successfulExecutions} />
        <MetricCard label="Falhas" value={snapshot.metrics.failedExecutions} />
        <MetricCard label="Retries" value={snapshot.metrics.retries} />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Conectores</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.connectors.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhum conector registrado.</li>
          ) : (
            snapshot.connectors.map((connector) => (
              <li
                key={connector.connectorId}
                className="rounded-lg border border-line p-4"
                data-testid="connector-monitor-item"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{connector.name}</p>
                    <p className="text-xs text-ink-soft">
                      {connector.connectorId} · v{connector.version} · prioridade {connector.priority}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className={HEALTH_COLORS[connector.health]}>
                      {HEALTH_LABELS[connector.health]}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {connector.enabled ? "Habilitado" : "Desabilitado"} · {connector.executionStatus}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-ink-soft sm:grid-cols-3">
                  <div>
                    <dt>Disponibilidade</dt>
                    <dd className="font-medium text-ink">
                      {(connector.availability * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt>Latência média</dt>
                    <dd className="font-medium text-ink">{connector.averageLatencyMs}ms</dd>
                  </div>
                  <div>
                    <dt>Última sync</dt>
                    <dd className="font-medium text-ink">
                      {connector.lastSyncAt
                        ? new Date(connector.lastSyncAt).toLocaleString("pt-BR")
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {connector.lastError && (
                  <p className="mt-2 text-xs text-coral">Último erro: {connector.lastError}</p>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Fila de retries</h2>
        <ul className="mt-3 space-y-2">
          {snapshot.retryQueue.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhum retry pendente.</li>
          ) : (
            snapshot.retryQueue.map((job) => (
              <li key={job.jobId} className="rounded-lg border border-line px-3 py-2 text-sm">
                <span className="font-medium text-ink">{job.connectorId}</span>
                <span className="ml-2 text-ink-soft">
                  tentativa {job.attempt}/{job.maxAttempts} · {job.status}
                </span>
                {job.lastError && (
                  <p className="mt-1 text-xs text-coral">{job.lastError}</p>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Eventos recentes</h2>
        <ol className="mt-3 space-y-2">
          {snapshot.recentEvents.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhum evento registrado.</li>
          ) : (
            snapshot.recentEvents
              .slice()
              .reverse()
              .slice(0, 20)
              .map((event) => (
                <li key={event.eventId} className="rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{event.eventType}</span>
                  <span className="ml-2 text-ink-soft">{event.connectorId}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    {new Date(event.timestamp).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))
          )}
        </ol>
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
