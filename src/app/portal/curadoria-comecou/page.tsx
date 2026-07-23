import type { Metadata } from "next";

import { CuradoriaComecouLoader } from "@/components/portal/CuradoriaComecouLoader";

export const metadata: Metadata = {
  title: "A curadoria começou — Aliviar",
  description: "Percepção de evolução da jornada quando a análise do caso inicia.",
};

export default function CuradoriaComecouPage() {
  return <CuradoriaComecouLoader />;
}
