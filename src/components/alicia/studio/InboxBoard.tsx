"use client";

import Link from "next/link";

import { checklistProgress } from "@/alicia/studio/operational-checklist";
import {
  STUDIO_STATUSES,
  STUDIO_STATUS_LABELS,
  type StudioCandidate,
  type StudioCandidateStatus,
} from "@/alicia/studio/types";

import { PUBLICATION_PIPELINE_REASON_LABELS } from "@/alicia/studio/publication-bridge";

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
  const { state, reviewCases, publicationReviewCases } = useStudio();

  return (
    <div className="space-y-8" data-testid="studio-inbox">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Inbox</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {state.candidates.length} candidatos · {reviewCases.length} review case(s) do Protocol
          Engine · {publicationReviewCases.length} exceção(ões) do Publication Pipeline
        </p>
      </div>

      {reviewCases.length > 0 && (
        <section className="card p-6" data-testid="studio-review-cases">
          <h2 className="text-sm font-semibold text-ink">Review Cases — Protocol Engine</h2>
          <p className="mt-1 text-sm text-ink-soft">
            O Studio não decide elegibilidade. Estes casos exigem resolução humana.
          </p>
          <ul className="mt-4 space-y-3">
            {reviewCases.map((reviewCase) => (
              <li key={reviewCase.candidateId} className="rounded-lg border border-line p-3">
                <Link
                  href={`/alicia/studio/candidatos/${reviewCase.candidateId}`}
                  className="font-medium text-ink hover:text-coral"
                >
                  {reviewCase.candidateName}
                </Link>
                <p className="mt-1 text-xs text-ink-soft">{reviewCase.caseId}</p>
                <p className="mt-2 text-sm text-coral">{reviewCase.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {publicationReviewCases.length > 0 && (
        <section className="card p-6" data-testid="studio-publication-review-cases">
          <h2 className="text-sm font-semibold text-ink">Review Cases — Publication Pipeline</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Exceções de publicação. Não há bypass do Protocol Engine ou do preflight.
          </p>
          <ul className="mt-4 space-y-3">
            {publicationReviewCases.map((reviewCase) => (
              <li key={`${reviewCase.candidateId}-${reviewCase.reason}`} className="rounded-lg border border-line p-3">
                <Link
                  href={`/alicia/studio/candidatos/${reviewCase.candidateId}`}
                  className="font-medium text-ink hover:text-coral"
                >
                  {reviewCase.caseId}
                </Link>
                <p className="mt-1 text-xs text-ink-soft">
                  {PUBLICATION_PIPELINE_REASON_LABELS[reviewCase.reason]}
                </p>
                <p className="mt-2 text-sm text-coral">{reviewCase.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

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
