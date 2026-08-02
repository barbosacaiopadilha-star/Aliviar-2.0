import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import Link from "next/link";

import { JornadaTimeline } from "@/components/curadoria/jornada-timeline";
import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { PatientCard, PatientWelcome } from "@/components/paciente/dashboard/patient-primitives";
import { PatientStatusWidget } from "@/components/paciente/dashboard/patient-status-widget";
import { buildJornada } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

async function loadMinhaCuradoria() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;
  return loadCuradoriaRecord(supabase, caseId);
}

export default async function MinhaJornadaPage() {
  const record = await loadMinhaCuradoria();
  if (!record) return <SemCuradoria />;
  const jornada = buildJornada(record);
  const current = jornada.stages.find((stage) => stage.id === jornada.currentStage)!;

  return (
    <div className="space-y-12">
      <PatientWelcome
        name={jornada.patientFirstName}
        subtitle={current.description}
      />

      <PatientStatusWidget jornada={jornada} currentStage={current} />

      <section aria-labelledby="jornada-heading" className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
            Caminho completo
          </p>
          <h2
            id="jornada-heading"
            className="mt-2 font-serif text-2xl font-medium text-[var(--patient-ink)] lg:text-3xl"
          >
            Sua jornada, do começo ao acompanhamento
          </h2>
        </div>
        <JornadaTimeline jornada={jornada} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PatientCard>
          <h3 className="font-serif text-xl font-medium text-[var(--patient-ink)]">Suas prioridades</h3>
          <p className="patient-body mt-3 text-[var(--color-ink-muted)]">
            O que você definiu como importante, e que orientou toda a Curadoria.
          </p>
          <Link
            href="/portal-paciente/prioridades"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Ver meu Perfil de Prioridades →
          </Link>
        </PatientCard>

        <WhatsappContact />
      </div>
    </div>
  );
}
