"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import type { CuratorWorkspaceView } from "@/curator-workspace";

interface CuratorWorkspaceSurfaceProps {
  initialView: CuratorWorkspaceView;
  journeyId: string;
  onViewChange: (view: CuratorWorkspaceView) => void;
}

export function CuratorWorkspaceSurface({
  initialView,
  journeyId,
  onViewChange,
}: CuratorWorkspaceSurfaceProps) {
  const [view, setView] = useState(initialView);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [evidenceOrigin, setEvidenceOrigin] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");

  const [candidateId, setCandidateId] = useState("");
  const [candidateSpecialty, setCandidateSpecialty] = useState("");
  const [candidateJustification, setCandidateJustification] = useState("");
  const [candidateCriterion, setCandidateCriterion] = useState("");
  const [candidateRationale, setCandidateRationale] = useState("");

  const [noteContent, setNoteContent] = useState("");

  async function mutate(body: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/curador/workspace/${journeyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Não foi possível atualizar o relatório.");
      }

      const nextView = (await response.json()) as CuratorWorkspaceView;
      setView(nextView);
      onViewChange(nextView);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Erro na operação.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddEvidence(event: FormEvent) {
    event.preventDefault();
    await mutate({
      action: "add_evidence",
      evidence: {
        origin: evidenceOrigin,
        description: evidenceDescription,
        type: "CLINICAL",
        confidence: 0.85,
        reference: evidenceReference,
      },
    });
    setEvidenceOrigin("");
    setEvidenceDescription("");
    setEvidenceReference("");
  }

  async function handleAddCandidate(event: FormEvent) {
    event.preventDefault();
    const relatedEvidenceIds = view.evidences.length > 0 ? [view.evidences[0]!.id] : [];
    await mutate({
      action: "add_candidate",
      candidate: {
        identification: candidateId,
        specialty: candidateSpecialty,
        justification: candidateJustification,
        relatedEvidenceIds,
        priority: view.medicalCandidates.length + 1,
        selectionReasons: [{ criterion: candidateCriterion, rationale: candidateRationale }],
      },
    });
    setCandidateId("");
    setCandidateSpecialty("");
    setCandidateJustification("");
    setCandidateCriterion("");
    setCandidateRationale("");
  }

  async function handleAddNote(event: FormEvent) {
    event.preventDefault();
    await mutate({ action: "add_note", content: noteContent });
    setNoteContent("");
  }

  async function handleSubmitForReview() {
    await mutate({ action: "submit_for_review" });
  }

  return (
    <main className="min-h-screen bg-paper" data-testid="curator-workspace">
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <header className="space-y-2 border-b border-ink/10 pb-8">
          <Link href="/curador" className="text-sm text-ink/50 hover:text-ink/70">
            ← Voltar
          </Link>
          <p className="text-sm text-ink/50" data-testid="workspace-patient">
            {view.patientName}
          </p>
          <h1 className="text-3xl font-light text-ink" data-testid="workspace-case-title">
            {view.caseTitle}
          </h1>
          <dl className="grid gap-3 text-sm text-ink/70 sm:grid-cols-3">
            <div>
              <dt className="text-ink/45">Jornada</dt>
              <dd data-testid="workspace-journey-state">{view.journeyState}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Relatório</dt>
              <dd data-testid="workspace-report-status">{view.statusLabel}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Versão</dt>
              <dd data-testid="workspace-version">{view.currentVersion}</dd>
            </div>
          </dl>
        </header>

        <section className="space-y-4" data-testid="workspace-context">
          <h2 className="text-sm text-ink/50">Contexto consolidado</h2>
          <p className="text-base leading-relaxed text-ink/80">{view.sharedContextSummary}</p>
          <p className="text-sm text-ink/60">{view.context.comprehension}</p>
          {view.context.organizacao.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-sm font-medium text-ink/70">{group.title}</h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id} className="rounded-lg bg-white/60 px-4 py-3 text-sm text-ink/75">
                    <p className="font-medium">{item.label}</p>
                    {item.detail ? <p className="text-ink/60">{item.detail}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="space-y-4" data-testid="workspace-evidences">
          <h2 className="text-sm text-ink/50">Evidências</h2>
          {view.evidences.length === 0 ? (
            <p className="text-sm text-ink/60">Nenhuma evidência registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {view.evidences.map((evidence) => (
                <li key={evidence.id} className="rounded-lg border border-ink/10 px-4 py-3 text-sm">
                  <p className="font-medium text-ink/80">{evidence.description}</p>
                  <p className="text-ink/55">
                    {evidence.origin} · {evidence.type} · confiança {evidence.confidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4" data-testid="workspace-candidates">
          <h2 className="text-sm text-ink/50">Candidatos médicos</h2>
          {view.medicalCandidates.length === 0 ? (
            <p className="text-sm text-ink/60">Nenhum candidato registrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {view.medicalCandidates.map((candidate) => (
                <li key={candidate.id} className="rounded-lg border border-ink/10 px-4 py-3 text-sm">
                  <p className="font-medium text-ink/80">
                    {candidate.identification} · {candidate.specialty}
                  </p>
                  <p className="text-ink/65">{candidate.justification}</p>
                  {candidate.selectionReasons.map((reason) => (
                    <p key={`${candidate.id}-${reason.criterion}`} className="text-ink/55">
                      {reason.criterion}: {reason.rationale}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4" data-testid="workspace-notes">
          <h2 className="text-sm text-ink/50">Notas do curador</h2>
          {view.curatorNotes.length === 0 ? (
            <p className="text-sm text-ink/60">Nenhuma nota registrada.</p>
          ) : (
            <ul className="space-y-2">
              {view.curatorNotes.map((note) => (
                <li key={note.id} className="rounded-lg bg-white/50 px-4 py-3 text-sm text-ink/75">
                  {note.content}
                </li>
              ))}
            </ul>
          )}
        </section>

        {view.editable ? (
          <div className="space-y-10 border-t border-ink/10 pt-10">
            <form className="space-y-3" onSubmit={handleAddEvidence} data-testid="workspace-add-evidence-form">
              <h2 className="text-sm text-ink/50">Adicionar evidência</h2>
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Origem"
                value={evidenceOrigin}
                onChange={(event) => setEvidenceOrigin(event.target.value)}
                data-testid="workspace-evidence-origin"
              />
              <textarea
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Descrição"
                value={evidenceDescription}
                onChange={(event) => setEvidenceDescription(event.target.value)}
                data-testid="workspace-evidence-description"
              />
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Referência"
                value={evidenceReference}
                onChange={(event) => setEvidenceReference(event.target.value)}
                data-testid="workspace-evidence-reference"
              />
              <button type="submit" disabled={submitting} className="btn-secondary" data-testid="workspace-add-evidence">
                Registrar evidência
              </button>
            </form>

            <form className="space-y-3" onSubmit={handleAddCandidate} data-testid="workspace-add-candidate-form">
              <h2 className="text-sm text-ink/50">Adicionar candidato</h2>
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Identificação"
                value={candidateId}
                onChange={(event) => setCandidateId(event.target.value)}
                data-testid="workspace-candidate-id"
              />
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Especialidade"
                value={candidateSpecialty}
                onChange={(event) => setCandidateSpecialty(event.target.value)}
                data-testid="workspace-candidate-specialty"
              />
              <textarea
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Justificativa"
                value={candidateJustification}
                onChange={(event) => setCandidateJustification(event.target.value)}
                data-testid="workspace-candidate-justification"
              />
              <input
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Critério"
                value={candidateCriterion}
                onChange={(event) => setCandidateCriterion(event.target.value)}
                data-testid="workspace-candidate-criterion"
              />
              <textarea
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Racional da seleção"
                value={candidateRationale}
                onChange={(event) => setCandidateRationale(event.target.value)}
                data-testid="workspace-candidate-rationale"
              />
              <button type="submit" disabled={submitting} className="btn-secondary" data-testid="workspace-add-candidate">
                Registrar candidato
              </button>
            </form>

            <form className="space-y-3" onSubmit={handleAddNote} data-testid="workspace-add-note-form">
              <h2 className="text-sm text-ink/50">Adicionar nota</h2>
              <textarea
                className="w-full rounded-lg border border-ink/15 px-4 py-2"
                placeholder="Observação do curador"
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
                data-testid="workspace-note-content"
              />
              <button type="submit" disabled={submitting} className="btn-secondary" data-testid="workspace-add-note">
                Registrar nota
              </button>
            </form>

            {view.reportStatus === "DRAFT" ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmitForReview()}
                className="btn-primary"
                data-testid="workspace-submit-review"
              >
                Submeter para revisão
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-ink/60" data-testid="workspace-readonly">
            Relatório não editável neste status.
          </p>
        )}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </main>
  );
}
