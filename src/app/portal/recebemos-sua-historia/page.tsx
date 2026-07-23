import type { Metadata } from "next";

import { HistoriaRecebidaLoader } from "@/components/portal/HistoriaRecebidaLoader";

export const metadata: Metadata = {
  title: "Nós recebemos sua história — Aliviar",
  description: "Confirmação humana após o compartilhamento de contexto.",
};

export default function HistoriaRecebidaPage() {
  return <HistoriaRecebidaLoader />;
}
