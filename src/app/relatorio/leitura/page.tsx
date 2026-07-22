import type { Metadata } from "next";

import { CurationReportExperience } from "@/components/experience/chapter-seven/CurationReportExperience";

export const metadata: Metadata = {
  title: "Relatório de Curadoria — Aliviar",
  description:
    "Parecer técnico organizado para apoiar sua decisão — com critérios, justificativas e profissionais recomendados.",
};

export default function RelatorioLeituraPage() {
  return <CurationReportExperience />;
}
