"use client";

import { useExperience } from "@/components/canonical/ExperienceProvider";
import { ExperienceStateGate } from "@/components/canonical/ExperienceStateGate";
import { LandingSurface } from "@/components/canonical/surfaces/LandingSurface";
import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import { mapLandingExperienceModel } from "@/experience-layer/mappers/landing";
import { resolveCanonicalRoute } from "@/experience-layer/resolve-canonical-experience";

interface CanonicalExperienceViewProps {
  surface: "landing" | "onboarding" | "minha-jornada";
}

export function CanonicalExperienceView({ surface }: CanonicalExperienceViewProps) {
  if (surface === "landing") {
    return <LandingSurface model={mapLandingExperienceModel()} />;
  }

  return <JourneyExperienceView surface={surface} />;
}

function JourneyExperienceView({
  surface,
}: {
  surface: "onboarding" | "minha-jornada";
}) {
  const { loadState } = useExperience();

  return (
    <ExperienceStateGate>
      {loadState.status === "ready" ? (
        <CanonicalReadySurface surface={surface} />
      ) : null}
    </ExperienceStateGate>
  );
}

function CanonicalReadySurface({
  surface,
}: {
  surface: "onboarding" | "minha-jornada";
}) {
  const { loadState } = useExperience();

  if (loadState.status !== "ready") {
    return null;
  }

  const { experience } = loadState;
  const route = resolveCanonicalRoute(loadState.view);

  if (surface === "onboarding" && route === "/onboarding" && experience.onboarding) {
    return <OnboardingSurface model={experience.onboarding} />;
  }

  if (surface === "minha-jornada" && route === "/minha-jornada" && experience.minhaJornada) {
    return (
      <MinhaJornadaSurface model={experience.minhaJornada} ace={experience.ace} />
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center" data-testid="experience-route-mismatch">
      <p className="text-ink-soft">Esta página não corresponde à etapa atual da sua jornada.</p>
    </div>
  );
}
