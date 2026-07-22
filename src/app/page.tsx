import type { Metadata } from "next";

import { CanonicalExperiencePage } from "@/components/canonical/CanonicalExperiencePage";

export const metadata: Metadata = {
  title: "Aliviar — Curadoria Médica",
  description: "Você não precisa navegar a saúde sozinho.",
};

export default function HomePage() {
  return <CanonicalExperiencePage jornadaId={null} surface="landing" />;
}
