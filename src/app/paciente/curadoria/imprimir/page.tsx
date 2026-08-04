import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestFinalCuradoriaDeliveryForPatient } from "@/modules/concierge";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";

import { CuradoriaPrintView } from "@/components/patient/curadoria-print-view";
import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { PrintButton } from "@/components/patient/print-button";

export const metadata: Metadata = {
  title: "Minha Curadoria — versão para impressão",
  robots: { index: false, follow: false },
};

/**
 * Item 1.7 (A5): o PDF deixou de depender da entrega legada.
 *
 * Esta página só sabia imprimir a entrega legada — quem tinha apenas a
 * Curadoria do Método, que é o caminho canônico, chegava aqui e recebia 404.
 * Agora a Curadoria do Método é impressa quando existe, e o formato legado
 * permanece imprimível para quem só tem ele: nada foi apagado, e ninguém perde
 * o documento que já recebeu (DP-2).
 *
 * A ordem é a mesma da tela: uma entrega por vez, nunca duas (critério X4).
 */
export default async function PatientCuradoriaPrintPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const curadoria = await loadPatientCuradoria(supabase);
  if (curadoria) {
    return (
      <div className="space-y-4">
        <PrintButton />
        <CuradoriaPrintView curadoria={curadoria} />
      </div>
    );
  }

  const delivery = await getLatestFinalCuradoriaDeliveryForPatient(supabase, authState.user.id);
  if (!delivery) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <PrintButton />
      <FinalCuradoriaView delivery={delivery} />
    </div>
  );
}
