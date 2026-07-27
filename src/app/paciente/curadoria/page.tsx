import Link from "next/link";

import type { Metadata } from "next";

import { PatientEmptyState } from "@/components/paciente/dashboard/patient-primitives";
import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import { PatientCuradoriaView } from "@/components/patient/patient-curadoria-view";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
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

  // A Curadoria do Método (COS): as três opções que o Curador entregou, com o
  // parecer de cada uma, e o lugar onde ELA registra a decisão. A RLS libera a
  // leitura pelo `delivered_at` do Relatório e só aceita a decisão da própria
  // pessoa — por isso este painel vive aqui, e não no portal do Curador.
  const curadoria = await loadPatientCuradoria(supabase);

  if (!delivery && !curadoria) {
    return (
      <PatientEmptyState
        title="Ainda não há relatórios aqui."
        description="Quando sua curadoria finalizar os três caminhos, eles aparecerão com calma neste espaço — para reler com a família ou levar à consulta."
      />
    );
  }

  // O Case do qual o acompanhamento depende — vindo da Curadoria do Método
  // quando ela existe, e só então do registro legado. Antes, Connection e
  // Relationship só apareciam se houvesse entrega do motor antigo: pelo
  // caminho canônico a pessoa lia as três opções e não tinha como seguir.
  const caseId = curadoria?.caseId ?? delivery?.caseId ?? null;

  const connection = caseId
    ? await new SupabaseConnectionRepository(supabase).findByCaseId(caseId)
    : null;

  const relationship =
    caseId && connection?.status === "PRIMEIRO_ATENDIMENTO_REALIZADO"
      ? await new SupabaseRelationshipRepository(supabase).findByCaseId(caseId)
      : null;

  // As três opções entregues, na forma que os painéis de acompanhamento leem.
  // Só os campos com correspondência real são preenchidos: `attentionPoints`
  // é o que a opção custa, e é exatamente o que o painel chama de limitação.
  const options = curadoria
    ? curadoria.options.map((option) => ({
        providerId: option.professionalProfileId,
        displayName: option.professionalName,
        professionalSummary: option.relationToWeights,
        whyIncluded: option.justification,
        strengthsForThisCase: option.favorablePoints,
        relevantLimitations: option.attentionPoints,
        practicalConsiderations: [],
      }))
    : (delivery?.providerPresentations ?? []);

  return (
    <div className="space-y-8">
      {curadoria ? <PatientCuradoriaView curadoria={curadoria} /> : null}

      {delivery ? <FinalCuradoriaView delivery={delivery} /> : null}

      {caseId && options.length > 0 ? (
        <>
          <ConnectionChoicePanel
            caseId={caseId}
            providerPresentations={options}
            connection={connection}
          />
          {relationship ? (
            <RelationshipStatusPanel
              caseId={caseId}
              relationship={relationship}
              providerPresentations={options}
            />
          ) : null}
        </>
      ) : null}

      {delivery ? (
        <>
          <Link
            href="/paciente/curadoria/imprimir"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--patient-ink)] shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Baixar em PDF
          </Link>
        </>
      ) : null}
    </div>
  );
}
