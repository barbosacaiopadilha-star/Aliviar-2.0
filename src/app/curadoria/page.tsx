import type { Metadata } from "next";

import { CurationJourneyExperience } from "@/components/experience/chapter-five/CurationJourneyExperience";

export const metadata: Metadata = {
  title: "Curadoria em andamento — Aliviar",
  description: "Enquanto você vive sua vida, a equipe Aliviar cuida do seu caso.",
};

export default function CuradoriaPage() {
  return <CurationJourneyExperience />;
}
