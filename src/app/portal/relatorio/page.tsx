import type { Metadata } from "next";

import { ReportReadingLoader } from "@/components/portal/report-reading/ReportReadingLoader";

export const metadata: Metadata = {
  title: "Leitura do relatório — Aliviar",
  description: "Leia oficialmente seu relatório de curadoria e confirme a leitura.",
};

export default function PortalRelatorioPage() {
  return <ReportReadingLoader />;
}
