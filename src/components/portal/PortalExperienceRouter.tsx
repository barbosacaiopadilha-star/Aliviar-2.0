"use client";

import { AceCard, JourneyHeader, OnboardingProgress } from "@/components/canonical";
import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import { useExperience } from "@/components/canonical/ExperienceProvider";
import { ExperienceStateGate } from "@/components/canonical/ExperienceStateGate";
import { AcompanhamentoPortalSurface } from "@/components/portal/surfaces/AcompanhamentoPortalSurface";
import { CuradoriaPortalSurface } from "@/components/portal/surfaces/CuradoriaPortalSurface";
import { DocumentosPortalSurface } from "@/components/portal/surfaces/DocumentosPortalSurface";
import { EntregaPortalSurface } from "@/components/portal/surfaces/EntregaPortalSurface";
import { EscolhaPortalSurface } from "@/components/portal/surfaces/EscolhaPortalSurface";
import { OnboardingPortalSurface } from "@/components/portal/surfaces/OnboardingPortalSurface";
import { resolvePortalSurface } from "@/experience-layer/resolve-canonical-experience";

export function PortalExperienceRouter() {
  const { loadState, refresh } = useExperience();

  return (
    <ExperienceStateGate>
      {loadState.status === "ready" ? (
        <PortalReadySurface onRefresh={refresh} />
      ) : null}
    </ExperienceStateGate>
  );
}

function PortalReadySurface({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { loadState } = useExperience();

  if (loadState.status !== "ready") {
    return null;
  }

  const { view, experience } = loadState;
  const surface = resolvePortalSurface(view);

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-12" data-testid="portal-shell">
        <JourneyHeader titulo="Portal do Paciente" estado_visivel={view.estado_visivel} />

        {surface === "onboarding" && experience.onboarding ? (
          <>
            <OnboardingSurface model={experience.onboarding} />
            <OnboardingPortalSurface model={experience.onboarding} onAdvanced={onRefresh} />
          </>
        ) : null}

        {surface === "documentos" && experience.documentos ? (
          <DocumentosPortalSurface model={experience.documentos} onUploaded={onRefresh} />
        ) : null}

        {surface === "curadoria" && experience.curadoria ? (
          <CuradoriaPortalSurface model={experience.curadoria} />
        ) : null}

        {surface === "entrega" && experience.entrega ? (
          <EntregaPortalSurface model={experience.entrega} onAdvanced={onRefresh} />
        ) : null}

        {surface === "escolha" && experience.escolha ? (
          <EscolhaPortalSurface model={experience.escolha} onChosen={onRefresh} />
        ) : null}

        {surface === "acompanhamento" && experience.acompanhamento ? (
          <AcompanhamentoPortalSurface model={experience.acompanhamento} ace={experience.ace} />
        ) : null}

        {surface === "minha-jornada" && experience.minhaJornada ? (
          <>
            <MinhaJornadaSurface model={experience.minhaJornada} ace={experience.ace} />
            {experience.ace && experience.minhaJornada.ace_disponivel ? (
              <AceCard ace={experience.ace} />
            ) : null}
          </>
        ) : null}

        {surface === "onboarding" && experience.onboarding ? (
          <OnboardingProgress
            etapas={experience.onboarding.etapas_fluxo}
            percentual={experience.onboarding.progresso.percentual}
          />
        ) : null}
      </main>
    </div>
  );
}
