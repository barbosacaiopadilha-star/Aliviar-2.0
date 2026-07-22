import type { Metadata } from "next";

import { ReportReadyExperience } from "@/components/experience/chapter-six/ReportReadyExperience";

export const metadata: Metadata = {
  title: "Relatório pronto — Aliviar",
  description:
    "A curadoria foi concluída. Um trabalho feito com seriedade para a sua jornada.",
};

export default function RelatorioPage() {
  return <ReportReadyExperience />;
}
