import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { JourneySummary } from "@/components/JourneySummary";
import { getJourneyById } from "@/lib/data/queries";
import { requireActiveStaffProfile } from "@/lib/auth/staff";
import { JourneyNextStep } from "@/modules/journey-events/components/JourneyNextStep";
import { JourneyTimelineSection } from "@/modules/journey-events/components/JourneyTimelineSection";
import {
  getLatestNextStep,
  listJourneyEvents,
} from "@/modules/journey-events/queries/journey-events";
import { JourneyCommitmentSection } from "@/modules/journey-commitments/components/JourneyCommitmentSection";
import {
  journeyAcceptsCommitments,
  listActiveStaff,
  listJourneyCommitments,
} from "@/modules/journey-commitments/queries/commitments";

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ journeyId: string }>;
}) {
  await requireActiveStaffProfile();
  const { journeyId } = await params;

  const [journey, events, nextStep, commitments, staff, canAdd] = await Promise.all([
    getJourneyById(journeyId),
    listJourneyEvents(journeyId),
    getLatestNextStep(journeyId),
    listJourneyCommitments(journeyId),
    listActiveStaff(),
    journeyAcceptsCommitments(journeyId),
  ]);

  if (!journey) notFound();

  return (
    <AppShell
      title={journey.title}
      description="Compromissos, Timeline e acompanhamento da Jornada."
      actions={
        <Link href="/journeys" className="btn-secondary">
          Voltar
        </Link>
      }
    >
      <div className="space-y-8">
        <JourneySummary journey={journey} />
        <JourneyCommitmentSection
          journeyId={journeyId}
          commitments={commitments}
          staff={staff}
          canAdd={canAdd}
        />
        <JourneyNextStep nextStep={nextStep} />
        <JourneyTimelineSection journeyId={journeyId} events={events} />
      </div>
    </AppShell>
  );
}
