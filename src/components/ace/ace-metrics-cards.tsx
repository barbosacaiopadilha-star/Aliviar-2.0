import { ACE_EXECUTION_STATUS_LABELS, type AceExecutionMetrics } from "@/modules/concierge/types";

type AceMetricsCardsProps = {
  metrics: AceExecutionMetrics;
};

function topEntries(counts: Record<string, number>, limit = 3): [string, number][] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export function AceMetricsCards({ metrics }: AceMetricsCardsProps) {
  const blockedTop = topEntries(metrics.blockedReasonCounts);
  const failedTop = topEntries(metrics.failureCodeCounts);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Total de execuções</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{metrics.totalExecutions}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-muted sm:grid-cols-3">
          {(Object.keys(metrics.byStatus) as (keyof typeof metrics.byStatus)[]).map((status) => (
            <div key={status} className="flex justify-between gap-2">
              <dt>{ACE_EXECUTION_STATUS_LABELS[status]}</dt>
              <dd className="font-medium text-ink">{metrics.byStatus[status]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Tempo médio até concluir (P001-P008)</p>
        <p className="mt-1 text-2xl font-semibold text-ink">
          {metrics.averageCompletionMinutes !== null ? `${metrics.averageCompletionMinutes.toFixed(1)} min` : "—"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {metrics.averageCompletionMinutes === null
            ? "Nenhuma execução concluída ainda."
            : "Calculado sobre execuções concluídas (status Concluída)."}
        </p>
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Principais motivos de bloqueio</p>
        {blockedTop.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhum bloqueio registrado.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {blockedTop.map(([reason, count]) => (
              <li key={reason} className="flex justify-between gap-2">
                <span className="text-ink">{reason}</span>
                <span className="font-medium text-ink-muted">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Principais códigos de falha</p>
        {failedTop.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhuma falha registrada.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {failedTop.map(([code, count]) => (
              <li key={code} className="flex justify-between gap-2">
                <span className="text-ink">{code}</span>
                <span className="font-medium text-ink-muted">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
