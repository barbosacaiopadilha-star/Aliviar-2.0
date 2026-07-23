import Link from "next/link";

import type { RelatorioEmElaboracaoView } from "@/vertical-slice";

interface RelatorioEmElaboracaoSurfaceProps {
  view: RelatorioEmElaboracaoView;
}

export function RelatorioEmElaboracaoSurface({ view }: RelatorioEmElaboracaoSurfaceProps) {
  return (
    <main className="min-h-screen bg-paper" data-testid="relatorio-em-elaboracao">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-12 px-6 py-20">
        <div className="space-y-8">
          <p className="text-sm text-ink/45" data-testid="relatorio-elaboracao-patient">
            {view.patientName}
          </p>

          <h1
            className="text-3xl font-light leading-snug tracking-tight text-ink"
            data-testid="relatorio-elaboracao-headline"
          >
            {view.headline}
          </h1>

          <p
            className="text-xl leading-relaxed text-ink/80"
            data-testid="relatorio-elaboracao-narrative"
          >
            {view.narrative}
          </p>

          <p className="text-base leading-relaxed text-ink/60" data-testid="relatorio-elaboracao-continuation">
            {view.continuation}
          </p>
        </div>

        <div className="space-y-6 border-t border-ink/10 pt-10">
          <dl className="space-y-3 text-sm text-ink/55">
            <div>
              <dt className="text-ink/40">Estado da jornada</dt>
              <dd data-testid="relatorio-elaboracao-journey-state">{view.journeyState}</dd>
            </div>
          </dl>

          <Link
            href={view.portalHref}
            className="inline-block text-base text-ink/75 underline decoration-ink/20 underline-offset-4 transition hover:text-ink"
            data-testid="relatorio-elaboracao-continuar"
          >
            Continuar
          </Link>
        </div>
      </div>
    </main>
  );
}
