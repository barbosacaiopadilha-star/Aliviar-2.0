import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PatientSummary } from "@/components/PatientSummary";
import { JourneyList } from "@/components/JourneyList";
import { NewJourneyForm } from "@/components/PatientForm";
import { createJourneyForPatientAction } from "@/lib/actions/patients";
import { getPatientById, listActiveManagers, listJourneysForPatient } from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  await requireActiveStaffProfile();
  const { patientId } = await params;
  const [patient, journeys, managers] = await Promise.all([
    getPatientById(patientId),
    listJourneysForPatient(patientId),
    listActiveManagers(),
  ]);

  if (!patient) notFound();

  return (
    <AppShell
      title={patient.preferred_name?.trim() || patient.full_name}
      description="Informações básicas e Jornadas vinculadas."
      actions={
        <Link href="/patients" className="btn-secondary">
          Voltar
        </Link>
      }
    >
      <div className="space-y-8">
        <PatientSummary patient={patient} />

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Jornadas</h2>
          <JourneyList journeys={journeys} emptyTitle="Este paciente ainda não possui Jornadas" />
        </section>

        {managers.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Nova Jornada</h2>
            <NewJourneyForm
              patientId={patient.id}
              managers={managers}
              action={createJourneyForPatientAction}
            />
          </section>
        )}
      </div>
    </AppShell>
  );
}
