"use client";

import type { JourneyEventWithAuthor } from "@/modules/journey-events/types/journey-event";
import {
  ALL_JOURNEY_EVENT_CATEGORIES,
  JOURNEY_EVENT_CATEGORY_LABELS,
} from "@/modules/journey-events/types/journey-event";
import { JourneyTimelineItem } from "@/modules/journey-events/components/JourneyTimelineItem";
import { TimelineEmptyState } from "@/modules/journey-events/components/TimelineEmptyState";

export function JourneyTimeline({
  events,
  onCorrect,
  activeCategory,
  onCategoryChange,
}: {
  events: JourneyEventWithAuthor[];
  onCorrect?: (event: JourneyEventWithAuthor) => void;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-ink">Timeline</h2>
        {onCategoryChange && (
          <select
            value={activeCategory ?? ""}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="field-input w-auto min-w-[180px] text-sm"
          >
            <option value="">Todas as categorias</option>
            {ALL_JOURNEY_EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {JOURNEY_EVENT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        )}
      </div>

      {events.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <JourneyTimelineItem key={event.id} event={event} onCorrect={onCorrect} />
          ))}
        </div>
      )}
    </section>
  );
}
