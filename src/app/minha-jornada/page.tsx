import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import {
  isFixtureId,
  loadJornadaView,
} from "@/experience-layer/fixtures/jornada-fixtures";
import {
  resolveCanonicalExperience,
  resolveCanonicalRoute,
} from "@/experience-layer/resolve-canonical-experience";

export const metadata: Metadata = {
  title: "Minha Jornada",
  description: "Acompanhe sua jornada na Aliviar.",
};

interface MinhaJornadaPageProps {
  searchParams: Promise<{ fixture?: string }>;
}

export default async function MinhaJornadaPage({ searchParams }: MinhaJornadaPageProps) {
  const params = await searchParams;
  const fixtureId = params.fixture && isFixtureId(params.fixture) ? params.fixture : "ace";
  const view = loadJornadaView(fixtureId);

  if (!view) {
    redirect("/");
  }

  const route = resolveCanonicalRoute(view);
  if (route === "/") {
    redirect("/");
  }
  if (route === "/onboarding") {
    redirect(`/onboarding?fixture=${fixtureId}`);
  }

  const experience = resolveCanonicalExperience(view);
  if (!experience.minhaJornada) {
    redirect("/");
  }

  return (
    <MinhaJornadaSurface model={experience.minhaJornada} ace={experience.ace} />
  );
}
