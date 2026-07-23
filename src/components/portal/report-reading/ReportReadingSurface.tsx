"use client";

import Link from "next/link";
import { useState } from "react";

import type { ReportReadingView } from "@/product-experience/report-reading";

interface ReportReadingSurfaceProps {
  initialView: ReportReadingView;
  onViewChange: (view: ReportReadingView) => void;
}

export function ReportReadingSurface({ initialView, onViewChange }: ReportReadingSurfaceProps) {
  const [view, setView] = useState(initialView);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/me/relatorio-leitura", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Não foi possível confirmar a leitura.");
      }

      const nextView = (await response.json()) as ReportReadingView;
      setView(nextView);
      onViewChange(nextView);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Erro ao confirmar leitura.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper" data-testid="report-reading">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4 border-b border-ink/10 pb-10">
          <p className="text-sm text-ink/45" data-testid="report-reading-patient">
            {view.patientName}
          </p>
          <h1 className="text-3xl font-light leading-snug tracking-tight text-ink">
            Seu relatório de curadoria
          </h1>
          <p className="text-base leading-relaxed text-ink/65">
            Este documento reúne o que compreendemos da sua história, os critérios da análise e os
            profissionais indicados para você.
          </p>
        </header>

        <section className="space-y-4" data-testid="report-reading-context">
          <h2 className="text-lg font-medium text-ink">Seu contexto</h2>
          <p className="text-base leading-relaxed text-ink/80">{view.sharedContextSummary}</p>
          {view.memoryHighlights.map((highlight) => (
            <p key={highlight} className="text-base leading-relaxed text-ink/70">
              {highlight}
            </p>
          ))}
        </section>

        <section className="space-y-4" data-testid="report-reading-criteria">
          <h2 className="text-lg font-medium text-ink">O que consideramos no seu caso</h2>
          <ul className="space-y-2 text-base text-ink/75">
            {view.criteriaUsed.map((criterion) => (
              <li key={criterion}>• {criterion}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-6" data-testid="report-reading-candidates">
          <h2 className="text-lg font-medium text-ink">Médicos indicados</h2>
          {view.candidates.map((candidate) => (
            <article
              key={candidate.id}
              className="space-y-3 rounded-lg border border-ink/10 p-5"
              data-testid={`report-reading-candidate-${candidate.id}`}
            >
              <div>
                <h3 className="text-xl font-medium text-ink">{candidate.identification}</h3>
                <p className="text-sm text-ink/55">{candidate.specialty}</p>
              </div>
              <p className="text-base leading-relaxed text-ink/80">{candidate.justification}</p>
              <dl className="space-y-2 text-sm text-ink/70">
                {candidate.reasons.map((reason) => (
                  <div key={`${candidate.id}-${reason.criterion}`}>
                    <dt className="font-medium text-ink/80">{reason.criterion}</dt>
                    <dd>{reason.rationale}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>

        <footer className="space-y-6 border-t border-ink/10 pt-10">
          <dl className="space-y-2 text-sm text-ink/55">
            <div>
              <dt className="text-ink/40">Neste momento</dt>
              <dd data-testid="report-reading-journey-state">{view.journeyState}</dd>
            </div>
          </dl>

          {view.readConfirmedAt ? (
            <div className="space-y-4" data-testid="report-reading-confirmed">
              <p className="text-base leading-relaxed text-ink/75">
                Leitura confirmada. Sua jornada foi encerrada com o cuidado que ela merece.
              </p>
              <Link
                href={view.portalHref}
                className="inline-block text-base text-ink/75 underline decoration-ink/20 underline-offset-4 transition hover:text-ink"
              >
                Voltar ao portal
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!view.canConfirmReading || pending}
                className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="report-reading-confirm"
              >
                {pending ? "Confirmando..." : "Confirmo que li o relatório"}
              </button>
            </div>
          )}
        </footer>
      </div>
    </main>
  );
}
