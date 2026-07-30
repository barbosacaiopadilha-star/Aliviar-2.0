"use client";

/**
 * A hipótese do profissional em foco — segue o `J`/`K` e a coluna da
 * comparação, para o painel lateral falar do mesmo profissional que o Curador
 * está olhando.
 */

import { useMesaFoco } from "@/components/curadoria/mesa/mesa-foco";
import { PainelHipoteses } from "@/components/curadoria/mesa/painel-hipoteses";
import type { Hipotese } from "@/modules/curadoria/mesa-investigacao";

export function HipoteseEmFoco({ hipoteses }: { hipoteses: Hipotese[] }) {
  const foco = useMesaFoco();
  const indice = foco.indice >= 0 && foco.indice < hipoteses.length ? foco.indice : 0;
  return <PainelHipoteses hipotese={hipoteses[indice] ?? null} />;
}
