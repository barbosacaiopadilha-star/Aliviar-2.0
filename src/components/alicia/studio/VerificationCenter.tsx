"use client";

import type { VerificationCenterSnapshot } from "@/alicia/verification";
import type { ChangeClassification, VerificationDecisionOutcome } from "@/alicia/verification";

const DECISION_LABELS: Record<VerificationDecisionOutcome, string> = {
  VERIFIED: "Verificado",
  UPDATE_REQUIRED: "Atualização necessária",
  REVIEW_REQUIRED: "Revisão necessária",
  UNPUBLISH_RECOMMENDED: "Despublicação recomendada",
};

const CHANGE_LABELS: Record<ChangeClassification, string> = {
  NO_CHANGE: "Sem mudança",
  MINOR_CHANGE: "Mudança leve",
  MATERIAL_CHANGE: "Mudança material",
  CONFLICT: "Conflito",
};

type VerificationCenterProps = {
  snapshot: VerificationCenterSnapshot;
};

export function VerificationCenter({ snapshot }: VerificationCenterProps) {
  return (
    <div className="space-y-8" data-testid="verification-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Verification Center</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — revalidação contínua de perfis publicados.
        </p>
        {snapshot.lastRunAt && (
          <p className="mt-1 text-xs text-ink-soft">
            Última execução: {new Date(snapshot.lastRunAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Verificados" value={snapshot.metrics.profilesVerified} />
        <MetricCard label="Sem mudança" value={snapshot.metrics.noChange} />
        <MetricCard label="Mudanças leves" value={snapshot.metrics.minorChanges} />
        <MetricCard label="Mudanças materiais" value={snapshot.metrics.materialChanges} />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Fila de verificações</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.queue.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhuma verificação pendente.</li>
          ) : (
            snapshot.queue.map((item) => (
              <li key={item.queueId} className="rounded-lg border border-line p-3 text-sm">
                <p className="font-medium text-ink">{item.doctorName}</p>
                <p className="text-ink-soft">{item.reason}</p>
                <p className="text-xs text-ink-soft">
                  {item.frequency} · {new Date(item.scheduledAt).toLocaleString("pt-BR")}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Últimas verificações</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.recentRuns.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhuma verificação executada.</li>
          ) : (
            snapshot.recentRuns
              .slice()
              .reverse()
              .slice(0, 10)
              .map((run) => (
                <li key={run.runId} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-medium text-ink">{run.profileId}</p>
                    <p className="text-ink-soft">{DECISION_LABELS[run.decision.outcome]}</p>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {CHANGE_LABELS[run.change.classification]} · {run.latencyMs}ms
                  </p>
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Revisão pendente</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.pendingReview.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhuma revisão pendente.</li>
          ) : (
            snapshot.pendingReview.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-ink">{entry.profileId}</p>
                <p className="text-ink-soft">{DECISION_LABELS[entry.decision]}</p>
                <p className="text-xs text-ink-soft">
                  {new Date(entry.verifiedAt).toLocaleString("pt-BR")}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Histórico</h2>
        <ul className="mt-4 space-y-3">
          {snapshot.history.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhum registro no histórico.</li>
          ) : (
            snapshot.history
              .slice()
              .reverse()
              .slice(0, 15)
              .map((entry) => (
                <li key={entry.id} className="rounded-lg border border-line p-3 text-sm">
                  <p className="font-medium text-ink">
                    {entry.profileId} · v{entry.previousVersion} → v{entry.newVersion}
                  </p>
                  <p className="text-ink-soft">
                    {entry.verifiedBy} · {DECISION_LABELS[entry.decision]}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Fontes: {entry.sourcesConsulted.join(", ") || "—"}
                  </p>
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
