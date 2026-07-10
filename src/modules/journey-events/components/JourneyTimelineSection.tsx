"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { JourneyEventWithAuthor } from "@/modules/journey-events/types/journey-event";
import {
  correctJourneyEventAction,
  createJourneyEventAction,
} from "@/modules/journey-events/actions/journey-events";
import { CorrectJourneyEventDialog } from "@/modules/journey-events/components/CorrectJourneyEventDialog";
import { JourneyEventForm } from "@/modules/journey-events/components/JourneyEventForm";
import { JourneyTimeline } from "@/modules/journey-events/components/JourneyTimeline";

export function JourneyTimelineSection({
  journeyId,
  events,
}: {
  journeyId: string;
  events: JourneyEventWithAuthor[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [correctingEvent, setCorrectingEvent] = useState<JourneyEventWithAuthor | null>(null);
  const [activeCategory, setActiveCategory] = useState("");

  const refresh = useCallback(() => {
    router.refresh();
    setShowForm(false);
  }, [router]);

  const createAction = useMemo(
    () => createJourneyEventAction.bind(null, journeyId),
    [journeyId],
  );

  const correctAction = useMemo(
    () => correctJourneyEventAction.bind(null, journeyId),
    [journeyId],
  );

  const filteredEvents = activeCategory
    ? events.filter((e) => e.category === activeCategory)
    : events;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink">Acontecimentos</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Fechar formulário" : "Registrar acontecimento"}
        </button>
      </div>

      {showForm && (
        <JourneyEventForm journeyId={journeyId} action={createAction} onSuccess={refresh} />
      )}

      <JourneyTimeline
        events={filteredEvents}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onCorrect={setCorrectingEvent}
      />

      {correctingEvent && (
        <CorrectJourneyEventDialog
          event={correctingEvent}
          action={correctAction}
          onClose={() => setCorrectingEvent(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
