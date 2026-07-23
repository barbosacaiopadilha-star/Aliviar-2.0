import type { Metadata } from "next";

import { RelatorioEmElaboracaoLoader } from "@/components/portal/RelatorioEmElaboracaoLoader";

export const metadata: Metadata = {
  title: "O relatório está sendo construído — Aliviar",
  description: "Percepção de trabalho cuidadoso na elaboração do relatório.",
};

export default function RelatorioEmElaboracaoPage() {
  return <RelatorioEmElaboracaoLoader />;
}
