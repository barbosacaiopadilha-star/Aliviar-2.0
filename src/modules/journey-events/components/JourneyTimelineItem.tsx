"use client";

import type { JourneyEventWithAuthor } from "@/modules/journey-events/types/journey-event";
import { formatEventDateTime } from "@/modules/journey-events/types/journey-event";
import { JourneyEventCategoryBadge } from "@/modules/journey-events/components/JourneyEventCategoryBadge";

export function JourneyTimelineItem({
  event,
  onCorrect,
}: {
  event: JourneyEventWithAuthor;
  onCorrect?: (event: JourneyEventWithAuthor) => void;
}) {
  const canCorrect =
    event.source === "MANUAL" && !event.is_corrected && onCorrect;

  return (
    <article
      className={`card p-5 ${event.is_highlighted ? "ring-2 ring-coral/30" : ""} ${
        event.is_corrected ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{event.title}</h3>
            {event.is_highlighted && (
              <span className="badge bg-coral-soft text-coral">Destaque</span>
            )}
            {event.is_corrected && (
              <span className="badge bg-[#E8E8E8] text-[#666]">Corrigido</span>
            )}
            {event.corrected_event_id && (
              <span className="badge bg-[#F3E6C6] text-[#C7952E]">Correção</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <JourneyEventCategoryBadge category={event.category} />
            <span>{formatEventDateTime(event.occurred_at)}</span>
            {event.source === "SYSTEM" && <span>· Automático</span>}
          </div>
        </div>
        {canCorrect && (
          <button
            type="button"
            onClick={() => onCorrect(event)}
            className="btn-secondary text-xs"
          >
            Corrigir informação
          </button>
        )}
      </div>

      {event.corrected_original && (
        <p className="mt-3 rounded-lg bg-[#F5F0E8] px-3 py-2 text-xs text-ink-soft">
          Corrige o registro de &quot;{event.corrected_original.title}&quot; (
          {formatEventDateTime(event.corrected_original.occurred_at)})
        </p>
      )}

      {event.description && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Descrição</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{event.description}</p>
        </div>
      )}

      {event.journey_impact && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Impacto na Jornada
          </p>
          <p className="mt-1 text-sm text-ink">{event.journey_impact}</p>
        </div>
      )}

      {event.next_step && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Próximo passo</p>
          <p className="mt-1 text-sm text-ink">{event.next_step}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-soft">
        Registrado por {event.author?.full_name ?? "Equipe Aliviar"} ·{" "}
        {formatEventDateTime(event.created_at)}
      </p>
    </article>
  );
}
