import type { Metadata } from "next";

import { CompartilharContextoLoader } from "@/components/portal/CompartilharContextoLoader";

export const metadata: Metadata = {
  title: "Compartilhar contexto — Aliviar",
  description: "Ajude a equipe a compreender melhor sua história.",
};

export default function CompartilharContextoPage() {
  return <CompartilharContextoLoader />;
}
