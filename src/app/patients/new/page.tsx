import { AppShell } from "@/components/layout/AppShell";
import { CreatePatientForm } from "@/components/CreatePatientForm";
import { createPatientWithJourneyAction } from "@/lib/actions/patients";
import { listActiveManagers } from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

export default async function NewPatientPage() {
  await requireActiveStaffProfile();
  const managers = await listActiveManagers();

  return (
    <AppShell
      title="Novo paciente"
      description="Cadastre o paciente e a primeira Jornada em um único fluxo."
    >
      {managers.length === 0 ? (
        <div className="card p-6 text-sm text-ink-soft">
          Não há Gestores ativos disponíveis. Cadastre um perfil ADMIN ou MANAGER ativo no Supabase.
        </div>
      ) : (
        <CreatePatientForm managers={managers} action={createPatientWithJourneyAction} />
      )}
    </AppShell>
  );
}
