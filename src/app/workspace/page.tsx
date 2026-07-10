import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileBadge } from "@/components/ProfileBadge";
import { JourneyList } from "@/components/JourneyList";
import {
  countActivePatients,
  countOpenJourneys,
  listRecentJourneys,
} from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";
import { JourneyWithoutCommitmentList } from "@/modules/journey-commitments/components/JourneyWithoutCommitmentList";
import { listJourneysWithoutOpenCommitments } from "@/modules/journey-commitments/queries/commitments";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function WorkspacePage() {
  const profile = await requireActiveStaffProfile();
  const [activePatients, openJourneys, recentJourneys, journeysWithoutCommitment] =
    await Promise.all([
      countActivePatients(),
      countOpenJourneys(),
      listRecentJourneys(5),
      listJourneysWithoutOpenCommitments(),
    ]);

  return (
    <AppShell
      title={`${greeting()}, ${profile.full_name.split(" ")[0]}`}
      description="Visão operacional inicial da plataforma Aliviar."
      actions={
        <Link href="/patients/new" className="btn-primary">
          Novo paciente
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ProfileBadge profile={profile} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-sm text-ink-soft">Pacientes ativos</p>
            <p className="mt-2 font-serif text-3xl font-semibold">{activePatients}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-ink-soft">Jornadas abertas</p>
            <p className="mt-2 font-serif text-3xl font-semibold">{openJourneys}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="font-serif text-xl font-semibold">Jornadas sem compromisso em aberto</h2>
        <JourneyWithoutCommitmentList journeys={journeysWithoutCommitment} />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-serif text-xl font-semibold">Jornadas recentes</h2>
        <JourneyList journeys={recentJourneys} emptyTitle="Nenhuma Jornada recente" />
      </section>
    </AppShell>
  );
}
