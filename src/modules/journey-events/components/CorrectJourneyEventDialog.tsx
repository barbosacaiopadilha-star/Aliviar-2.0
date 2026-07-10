"use client";

import { useActionState, useEffect } from "react";
import type { JourneyEventWithAuthor } from "@/modules/journey-events/types/journey-event";
import type { JourneyEventActionResult } from "@/modules/journey-events/actions/journey-events";
import {
  ALL_JOURNEY_EVENT_CATEGORIES,
  JOURNEY_EVENT_CATEGORY_LABELS,
} from "@/modules/journey-events/types/journey-event";

function toLocalDateTime(iso: string) {
  const date = new Date(iso);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function CorrectJourneyEventDialog({
  event,
  action,
  onClose,
  onSuccess,
}: {
  event: JourneyEventWithAuthor;
  action: (
    prev: JourneyEventActionResult | null,
    formData: FormData,
  ) => Promise<JourneyEventActionResult | null>;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-semibold">Corrigir informação</h3>
            <p className="mt-1 text-sm text-ink-soft">
              O registro original será preservado e marcado como corrigido.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-[#F5F0E8] p-3 text-sm">
          <p className="font-semibold">{event.title}</p>
          {event.description && <p className="mt-1 text-ink-soft">{event.description}</p>}
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="original_event_id" value={event.id} />

          {state && !state.success && (
            <div className="rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="correction_reason" className="field-label">
              Motivo da correção *
            </label>
            <textarea
              id="correction_reason"
              name="correction_reason"
              rows={2}
              required
              className="field-input"
              placeholder="Explique o que estava incorreto"
            />
          </div>

          <div>
            <label htmlFor="corr_category" className="field-label">
              Categoria *
            </label>
            <select
              id="corr_category"
              name="category"
              required
              defaultValue={event.category}
              className="field-input"
            >
              {ALL_JOURNEY_EVENT_CATEGORIES.filter((c) => c !== "JOURNEY").map((cat) => (
                <option key={cat} value={cat}>
                  {JOURNEY_EVENT_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="corr_title" className="field-label">
              Título corrigido *
            </label>
            <input
              id="corr_title"
              name="title"
              required
              defaultValue={event.title}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="corr_description" className="field-label">
              Descrição corrigida
            </label>
            <textarea
              id="corr_description"
              name="description"
              rows={3}
              defaultValue={event.description ?? ""}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="corr_impact" className="field-label">
              Impacto na Jornada
            </label>
            <textarea
              id="corr_impact"
              name="journey_impact"
              rows={2}
              defaultValue={event.journey_impact ?? ""}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="corr_next_step" className="field-label">
              Próximo passo
            </label>
            <textarea
              id="corr_next_step"
              name="next_step"
              rows={2}
              defaultValue={event.next_step ?? ""}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="corr_occurred_at" className="field-label">
              Data e horário do acontecimento *
            </label>
            <input
              id="corr_occurred_at"
              name="occurred_at"
              type="datetime-local"
              required
              defaultValue={toLocalDateTime(event.occurred_at)}
              className="field-input"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_highlighted"
              defaultChecked={event.is_highlighted}
              className="rounded"
            />
            Destacar na Timeline
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Salvando..." : "Registrar correção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
