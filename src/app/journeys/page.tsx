import { AppShell } from "@/components/layout/AppShell";
import { JourneyList } from "@/components/JourneyList";
import { listJourneys } from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

export default async function JourneysPage() {
  await requireActiveStaffProfile();
  const journeys = await listJourneys();

  return (
    <AppShell title="Jornadas" description="Lista operacional de Jornadas.">
      <JourneyList journeys={journeys} />
    </AppShell>
  );
}
