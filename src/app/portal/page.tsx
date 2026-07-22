import type { Metadata } from "next";

import { ExperienceProvider } from "@/components/canonical/ExperienceProvider";
import { PortalExperienceRouter } from "@/components/portal/PortalExperienceRouter";

export const metadata: Metadata = {
  title: "Portal do Paciente — Aliviar",
  description: "Sua jornada na Aliviar.",
};

export default function PortalPage() {
  return (
    <ExperienceProvider jornadaId={null} mode="authenticated-patient">
      <PortalExperienceRouter />
    </ExperienceProvider>
  );
}
