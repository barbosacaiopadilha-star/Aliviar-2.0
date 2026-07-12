import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestFinalCuradoriaDeliveryForPatient } from "@/modules/concierge";

import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { PrintButton } from "@/components/patient/print-button";

export const metadata: Metadata = {
  title: "Minha Curadoria — versão para impressão",
  robots: { index: false, follow: false },
};

export default async function PatientCuradoriaPrintPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

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
