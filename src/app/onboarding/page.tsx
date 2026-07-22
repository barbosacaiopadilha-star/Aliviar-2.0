import type { Metadata } from "next";

import { CanonicalExperiencePage } from "@/components/canonical/CanonicalExperiencePage";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Conhecendo a Aliviar — no seu ritmo.",
};

interface OnboardingPageProps {
  searchParams: Promise<{ jornada?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const jornadaId = params.jornada?.trim() || null;

  return <CanonicalExperiencePage jornadaId={jornadaId} surface="onboarding" />;
}
