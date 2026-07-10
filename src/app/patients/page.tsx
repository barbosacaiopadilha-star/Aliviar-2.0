import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PatientList } from "@/components/PatientList";
import { listPatients } from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

export default async function PatientsPage() {
  await requireActiveStaffProfile();
  const patients = await listPatients();

  return (
    <AppShell
      title="Pacientes"
      description="Lista operacional de pacientes cadastrados."
      actions={
        <Link href="/patients/new" className="btn-primary">
          Novo paciente
        </Link>
      }
    >
      <PatientList patients={patients} />
    </AppShell>
  );
}
