import Link from "next/link";
import type { PrimeiroPortalView } from "@/vertical-slice";

interface PrimeiroPortalSurfaceProps {
  view: PrimeiroPortalView;
}

export function PrimeiroPortalSurface({ view }: PrimeiroPortalSurfaceProps) {
  return (
    <main className="min-h-screen bg-paper" data-testid="primeiro-portal">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-10 px-6 py-16">
        <p className="text-lg leading-relaxed text-ink/75" data-testid="portal-greeting">
          {view.greeting}
        </p>

        <div className="space-y-6">
          <h1 className="text-3xl font-light tracking-tight text-ink" data-testid="portal-patient-name">
            {view.patientName}
          </h1>

          <dl className="space-y-5 text-base leading-relaxed text-ink/85">
            <div>
              <dt className="text-sm text-ink/50">Neste momento</dt>
              <dd data-testid="portal-journey-state">{view.journeyState}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/50">De onde a gente continua</dt>
              <dd data-testid="portal-narrative-checkpoint">{view.narrativeCheckpoint}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/50">O próximo passo</dt>
              <dd data-testid="portal-next-action">{view.nextAction}</dd>
            </div>
            {view.comprehension ? (
              <div>
                <dt className="text-sm text-ink/50">O que já entendemos de você</dt>
                <dd data-testid="portal-comprehension">{view.comprehension}</dd>
              </div>
            ) : null}
            {view.journeyEvolution ? (
              <div>
                <dt className="text-sm text-ink/50">Agora</dt>
                <dd data-testid="portal-journey-evolution">{view.journeyEvolution}</dd>
              </div>
            ) : null}
            {view.trabalhoEmAndamento ? (
              <div>
                <dt className="text-sm text-ink/50">O que estamos fazendo</dt>
                <dd data-testid="portal-trabalho-em-andamento">{view.trabalhoEmAndamento}</dd>
              </div>
            ) : null}
          </dl>

          <Link
            href="/portal/compartilhar"
            className="inline-block text-base text-ink/70 underline decoration-ink/20 underline-offset-4 hover:text-ink"
            data-testid="portal-share-context-link"
          >
            Compartilhar algo que ajude a entender sua história
          </Link>
        </div>
      </div>
    </main>
  );
}
