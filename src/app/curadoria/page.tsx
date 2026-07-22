import type { Metadata } from "next";

import { CurationPresenceExperience } from "@/components/experience/chapter-four/CurationPresenceExperience";

export const metadata: Metadata = {
  title: "Curadoria em andamento — Aliviar",
  description: "Enquanto você vive sua vida, a equipe Aliviar cuida do seu caso.",
};

export default function CuradoriaPage() {
  return <CurationPresenceExperience />;
}
