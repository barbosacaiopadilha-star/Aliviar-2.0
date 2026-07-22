"use client";

import { ExperienceProvider } from "@/components/canonical/ExperienceProvider";
import { CanonicalExperienceView } from "@/components/canonical/CanonicalExperienceView";

interface CanonicalExperiencePageProps {
  jornadaId: string | null;
  surface: "landing" | "onboarding" | "minha-jornada";
}

export function CanonicalExperiencePage({ jornadaId, surface }: CanonicalExperiencePageProps) {
  if (surface === "landing") {
    return <CanonicalExperienceView surface="landing" />;
  }

  return (
    <ExperienceProvider jornadaId={jornadaId}>
      <CanonicalExperienceView surface={surface} />
    </ExperienceProvider>
  );
}
