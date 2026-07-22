import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import {
  isFixtureId,
  loadJornadaView,
} from "@/experience-layer/fixtures/jornada-fixtures";
import {
  resolveCanonicalExperience,
  resolveCanonicalRoute,
} from "@/experience-layer/resolve-canonical-experience";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Conhecendo a Aliviar — no seu ritmo.",
};

interface OnboardingPageProps {
  searchParams: Promise<{ fixture?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const fixtureId = params.fixture && isFixtureId(params.fixture) ? params.fixture : "primeiro-contato";
  const view = loadJornadaView(fixtureId);

  if (!view) {
    redirect("/");
  }

  const route = resolveCanonicalRoute(view);
  if (route === "/") {
    redirect("/");
  }
  if (route === "/minha-jornada") {
    redirect(`/minha-jornada?fixture=${fixtureId}`);
  }

  const experience = resolveCanonicalExperience(view);
  if (!experience.onboarding) {
    redirect("/");
  }

  return <OnboardingSurface model={experience.onboarding} />;
}
