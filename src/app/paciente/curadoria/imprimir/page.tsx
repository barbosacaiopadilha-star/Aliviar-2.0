import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";

import { CuradoriaPrintView } from "@/components/patient/curadoria-print-view";
import { PrintButton } from "@/components/patient/print-button";

export const metadata: Metadata = {
  title: "Minha Curadoria — versão para impressão",
  robots: { index: false, follow: false },
};

/**
 * Item 1.7 (A5): o PDF deixou de depender da entrega legada.
 *
 * Esta página já soube imprimir dois formatos — a Curadoria do Método e a
 * entrega do motor anterior, uma por vez, nunca duas (critério X4). O motor saiu, e
 * com ele o segundo formato: sobra o caminho canônico, que é o que a regra
 * sempre preferiu.
 *
 * Quem não tem Curadoria não tem o que imprimir, e a página diz isso do único
 * jeito honesto — 404. Inventar uma folha vazia seria pior.
 */
export default async function PatientCuradoriaPrintPage() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const curadoria = await loadPatientCuradoria(supabase);
  if (!curadoria) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <PrintButton />
      <CuradoriaPrintView curadoria={curadoria} />
    </div>
  );
}
