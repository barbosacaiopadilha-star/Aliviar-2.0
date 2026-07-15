import Link from "next/link";

import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestFinalCuradoriaDeliveryForPatient } from "@/modules/concierge";
import { SupabaseConnectionRepository } from "@/modules/connection";

import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Minha Curadoria",
  robots: { index: false, follow: false },
};

export default async function PatientCuradoriaPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const delivery = await getLatestFinalCuradoriaDeliveryForPatient(supabase, authState.user.id);

  if (!delivery) {
    return (
      <EmptyState
        title="Sua Curadoria ainda não está pronta."
        description="Assim que sua Curadoria for concluída pela equipe Aliviar, ela vai aparecer aqui — com uma explicação completa e os profissionais recomendados para você."
      />
    );
  }

  const connectionRepository = new SupabaseConnectionRepository(supabase);
  const connection = await connectionRepository.findByCaseId(delivery.caseId);

  return (
    <div className="space-y-4">
      <FinalCuradoriaView delivery={delivery} />
      <ConnectionChoicePanel caseId={delivery.caseId} providerPresentations={delivery.providerPresentations} connection={connection} />
      <Link
        href="/paciente/curadoria/imprimir"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-fast ease-standard hover:bg-canvas"
      >
        Baixar em PDF
      </Link>
    </div>
  );
}
