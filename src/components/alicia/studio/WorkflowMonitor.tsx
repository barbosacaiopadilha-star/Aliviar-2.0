"use client";

import type { WorkflowMonitorSnapshot } from "@/alicia/event-bus";
import type { DomainEventType } from "@/alicia/event-bus";

const EVENT_LABELS: Record<DomainEventType, string> = {
  DiscoveryCompleted: "Discovery concluído",
  CandidateQueued: "Candidato enfileirado",
  EvidenceRequested: "Evidência solicitada",
  EvidenceCollected: "Evidência coletada",
  EvidenceFailed: "Falha na evidência",
  ProtocolStarted: "Protocolo iniciado",
  ProtocolEvaluated: "Protocolo avaliado",
  PublicationRequested: "Publicação solicitada",
  PublicationStarted: "Publicação iniciada",
  PublicationSucceeded: "Publicação concluída",
  PublicationFailed: "Publicação falhou",
  PublicationRolledBack: "Rollback executado",
  ReviewCaseCreated: "Review case criado",
  ReviewCaseResolved: "Review case resolvido",
  VerificationRequested: "Verificação solicitada",
  VerificationStarted: "Verificação iniciada",
  VerificationCompleted: "Verificação concluída",
  VerificationFailed: "Verificação falhou",
  ProfileChanged: "Perfil alterado",
  ReviewRequested: "Revisão solicitada",
  EvidencePackageCreated: "Evidence package criado",
  EvidenceConflictDetected: "Conflito de evidência",
  EvidencePackageUpdated: "Evidence package atualizado",
  EvidencePackageRejected: "Evidence package rejeitado",
  FactoryStarted: "Factory iniciada",
  FactoryFinished: "Factory concluída",
  FactoryFailed: "Factory falhou",
  FactoryCheckpoint: "Factory checkpoint",
  FactoryResumed: "Factory retomada",
  FactoryDryRun: "Factory dry run",
};

type WorkflowMonitorProps = {
  snapshot: WorkflowMonitorSnapshot;
};

export function WorkflowMonitor({ snapshot }: WorkflowMonitorProps) {
  return (
    <div className="space-y-8" data-testid="workflow-monitor">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Workflow Monitor</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Somente leitura — timeline de eventos, correlationId, retry e DLQ.
        </p>
        <p className="mt-1 text-xs text-ink-soft">Correlation: {snapshot.correlationId}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Eventos emitidos" value={snapshot.metrics.eventsPublished} />
        <MetricCard label="Processados" value={snapshot.metrics.eventsProcessed} />
        <MetricCard label="Retries" value={snapshot.metrics.retryCount} />
        <MetricCard label="DLQ" value={snapshot.metrics.dlqCount} />
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-ink">Timeline</h2>
        <ol className="mt-4 space-y-3">
          {snapshot.timeline.length === 0 ? (
            <li className="text-sm text-ink-soft">Nenhum evento registrado.</li>
          ) : (
            snapshot.timeline.map((entry) => (
              <li
                key={entry.event.eventId}
                className="rounded-lg border border-line p-3"
                data-testid="workflow-timeline-item"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {EVENT_LABELS[entry.event.eventType]}
                  </p>
                  <span className="text-xs text-ink-soft">
                    {new Date(entry.event.timestamp).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  aggregate: {entry.event.aggregateId} · source: {entry.event.source}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  correlation: {entry.event.correlationId}
                  {entry.event.causationId ? ` · causation: ${entry.event.causationId}` : ""}
                </p>
                {entry.inDlq && (
                  <p className="mt-1 text-xs text-coral">Presente na DLQ</p>
                )}
              </li>
            ))
          )}
        </ol>
      </section>

      {snapshot.pendingRetries.length > 0 && (
        <section className="card p-6" data-testid="workflow-retries">
          <h2 className="text-sm font-semibold text-ink">Retry pendente</h2>
          <ul className="mt-3 space-y-2">
            {snapshot.pendingRetries.map((job) => (
              <li key={job.jobId} className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                {job.handlerName} · tentativa {job.attempts}/{job.maxAttempts}
                {job.lastError ? ` — ${job.lastError}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {snapshot.dlq.length > 0 && (
        <section className="card p-6" data-testid="workflow-dlq">
          <h2 className="text-sm font-semibold text-ink">Dead Letter Queue</h2>
          <ul className="mt-3 space-y-2">
            {snapshot.dlq.map((item) => (
              <li key={item.id} className="rounded-lg border border-coral/30 bg-coral-soft/30 p-3 text-sm">
                {item.job.event.eventType} · {item.reason}
              </li>
            ))}
          </ul>
        </section>
      )}
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
