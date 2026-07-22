import type { Metadata } from "next";

import { JourneyContinuityExperience } from "@/components/experience/chapter-eight/JourneyContinuityExperience";

export const metadata: Metadata = {
  title: "Continuamos com você — Aliviar",
  description:
    "A entrega do relatório inaugura uma nova fase. Você continua acompanhado.",
};

export default function ContinuamosPage() {
  return <JourneyContinuityExperience />;
}
