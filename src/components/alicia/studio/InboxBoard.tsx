"use client";

import Link from "next/link";

import { checklistProgress } from "@/alicia/studio/operational-checklist";
import {
  STUDIO_STATUSES,
  STUDIO_STATUS_LABELS,
  type StudioCandidate,
  type StudioCandidateStatus,
} from "@/alicia/studio/types";

import { useStudio } from "./StudioProvider";

const STATUS_COLORS: Record<StudioCandidateStatus, string> = {
  novo: "border-slate-300 bg-slate-50",
  triagem: "border-amber-300 bg-amber-50",
  coleta: "border-blue-300 bg-blue-50",
  verificacao: "border-violet-300 bg-violet-50",
  revisao: "border-orange-300 bg-orange-50",
  publicado: "border-sage bg-sage-soft",
  arquivado: "border-line bg-paper",
};

function CandidateCard({ candidate }: { candidate: StudioCandidate }) {
  const progress = checklistProgress(candidate.checklist);

  return (
    <Link
      href={`/alicia/studio/candidatos/${candidate.id}`}
      className={`card block p-4 transition hover:shadow-sm ${STATUS_COLORS[candidate.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{candidate.name}</p>
          <p className="text-xs text-ink-soft">{candidate.caseId}</p>
        </div>
        {candidate.nivel && (
          <span className="rounded-full bg-paper-raised px-2 py-0.5 text-xs font-semibold text-ink">
            Nível {candidate.nivel}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        {candidate.specialty} · {candidate.city}
      </p>
      <p className="mt-2 text-xs text-ink-soft">
        Checklist: {progress.concluido}/{progress.total}
        {progress.bloqueado > 0 ? ` · ${progress.bloqueado} bloqueado(s)` : ""}
      </p>
      {candidate.pendencies.length > 0 && (
        <p className="mt-1 text-xs text-coral">
          {candidate.pendencies.length} pendência(s)
        </p>
      )}
    </Link>
  );
}

export function InboxBoard() {
  const { state } = useStudio();

  return (
    <div className="space-y-8" data-testid="studio-inbox">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Inbox</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {state.candidates.length} candidatos · arraste visual por status
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4 xl:grid-cols-7">
        {STUDIO_STATUSES.map((status) => {
          const items = state.candidates.filter((c) => c.status === status);
          return (
            <section key={status} className="min-w-0">
              <header className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  {STUDIO_STATUS_LABELS[status]}
                </h2>
                <span className="rounded-full bg-paper-raised px-2 py-0.5 text-xs text-ink-soft">
                  {items.length}
                </span>
              </header>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink-soft">
                    Vazio
                  </p>
                ) : (
                  items.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
