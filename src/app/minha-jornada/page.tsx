import type { Metadata } from "next";

import { CanonicalExperiencePage } from "@/components/canonical/CanonicalExperiencePage";

export const metadata: Metadata = {
  title: "Minha Jornada",
  description: "Acompanhe sua jornada na Aliviar.",
};

interface MinhaJornadaPageProps {
  searchParams: Promise<{ jornada?: string }>;
}

export default async function MinhaJornadaPage({ searchParams }: MinhaJornadaPageProps) {
  const params = await searchParams;
  const jornadaId = params.jornada?.trim() || null;

  return <CanonicalExperiencePage jornadaId={jornadaId} surface="minha-jornada" />;
}
