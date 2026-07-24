import Link from "next/link";

import type { Metadata } from "next";

import { PatientEmptyState } from "@/components/paciente/dashboard/patient-primitives";
import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestFinalCuradoriaDeliveryForPatient } from "@/modules/concierge";
import { SupabaseConnectionRepository } from "@/modules/connection";
import { SupabaseRelationshipRepository } from "@/modules/relationship";

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
      <PatientEmptyState
        title="Ainda não há relatórios aqui."
        description="Quando sua curadoria finalizar os três caminhos, eles aparecerão com calma neste espaço — para reler com a família ou levar à consulta."
      />
    );
  }

  const connectionRepository = new SupabaseConnectionRepository(supabase);
  const connection = await connectionRepository.findByCaseId(delivery.caseId);

  const relationshipRepository = new SupabaseRelationshipRepository(supabase);
  const relationship =
    connection?.status === "PRIMEIRO_ATENDIMENTO_REALIZADO"
      ? await relationshipRepository.findByCaseId(delivery.caseId)
      : null;

  return (
    <div className="space-y-8">
      <FinalCuradoriaView delivery={delivery} />
      <ConnectionChoicePanel
        caseId={delivery.caseId}
        providerPresentations={delivery.providerPresentations}
        connection={connection}
      />
      {relationship ? (
        <RelationshipStatusPanel
          caseId={delivery.caseId}
          relationship={relationship}
          providerPresentations={delivery.providerPresentations}
        />
      ) : null}
      <Link
        href="/paciente/curadoria/imprimir"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--patient-ink)] shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        Baixar em PDF
      </Link>
    </div>
  );
}
