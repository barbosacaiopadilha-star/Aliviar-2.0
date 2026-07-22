"use client";

import Link from "next/link";

import { checklistProgress } from "@/alicia/studio/operational-checklist";
import {
  STUDIO_STATUSES,
  STUDIO_STATUS_LABELS,
  type StudioCandidateStatus,
} from "@/alicia/studio/types";

import { HistoryPanel } from "./HistoryPanel";
import { OperationalChecklist } from "./OperationalChecklist";
import { SourcesPanel } from "./SourcesPanel";
import { useStudio } from "./StudioProvider";

export function CandidateDetail({ candidateId }: { candidateId: string }) {
  const { getCandidateById, setStatus, setNivel } = useStudio();
  const candidate = getCandidateById(candidateId);

  if (!candidate) {
    return (
      <div className="space-y-4">
        <p className="text-ink-soft">Candidato não encontrado.</p>
        <Link href="/alicia/studio/inbox" className="btn-secondary text-sm">
          Voltar ao Inbox
        </Link>
      </div>
    );
  }

  const progress = checklistProgress(candidate.checklist);

  return (
    <div className="space-y-8" data-testid="studio-candidate">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/alicia/studio/inbox"
            className="text-sm text-ink-soft hover:text-coral"
          >
            ← Inbox
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">{candidate.name}</h1>
          <p className="mt-1 font-mono text-sm text-ink-soft">{candidate.caseId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
            value={candidate.status}
            onChange={(e) => setStatus(candidateId, e.target.value as StudioCandidateStatus)}
            aria-label="Status do candidato"
          >
            {STUDIO_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STUDIO_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-line bg-paper-raised px-3 py-2 text-sm"
            value={candidate.nivel ?? ""}
            onChange={(e) => {
              if (e.target.value === "A" || e.target.value === "B") {
                setNivel(candidateId, e.target.value);
              }
            }}
            aria-label="Nível operacional"
          >
            <option value="">Sem nível</option>
            <option value="A">Nível A</option>
            <option value="B">Nível B</option>
          </select>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="CRM" value={candidate.crm || "—"} />
        <InfoCard label="RQE" value={candidate.rqe || "—"} />
        <InfoCard label="Cidade" value={candidate.city} />
        <InfoCard label="Especialidade" value={candidate.specialty} />
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Resumo operacional</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Status: <strong>{STUDIO_STATUS_LABELS[candidate.status]}</strong>
              {candidate.nivel ? ` · Nível ${candidate.nivel}` : ""}
            </p>
          </div>
          <p className="text-sm text-ink-soft">
            Checklist: {progress.concluido}/{progress.total}
          </p>
        </div>

        {candidate.pendencies.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Pendências
            </h3>
            <ul className="mt-2 space-y-1">
              {candidate.pendencies.map((item) => (
                <li key={item} className="text-sm text-coral">
                  Estamos verificando: {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <OperationalChecklist candidateId={candidateId} />
        <div className="space-y-6">
          <SourcesPanel candidateId={candidateId} />
          <HistoryPanel candidateId={candidateId} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
