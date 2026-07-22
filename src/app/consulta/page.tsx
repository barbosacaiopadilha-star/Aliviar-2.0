import type { Metadata } from "next";

import { InitialConsultationExperience } from "@/components/experience/chapter-three/InitialConsultationExperience";

export const metadata: Metadata = {
  title: "Consulta inicial — Aliviar",
  description: "Um encontro para compreender seu caso com profundidade e calma.",
};

export default function ConsultaPage() {
  return <InitialConsultationExperience />;
}
