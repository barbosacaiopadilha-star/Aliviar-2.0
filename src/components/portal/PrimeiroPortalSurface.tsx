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
              <dt className="text-sm text-ink/50">Estado da jornada</dt>
              <dd data-testid="portal-journey-state">{view.journeyState}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/50">Onde paramos</dt>
              <dd data-testid="portal-narrative-checkpoint">{view.narrativeCheckpoint}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink/50">Próxima ação</dt>
              <dd data-testid="portal-next-action">{view.nextAction}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
