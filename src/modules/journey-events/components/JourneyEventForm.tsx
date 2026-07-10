"use client";

import { useActionState, useEffect } from "react";
import type { JourneyEventActionResult } from "@/modules/journey-events/actions/journey-events";
import {
  ALL_JOURNEY_EVENT_CATEGORIES,
  JOURNEY_EVENT_CATEGORY_LABELS,
} from "@/modules/journey-events/types/journey-event";

function defaultDateTimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function JourneyEventForm({
  journeyId,
  action,
  onSuccess,
}: {
  journeyId: string;
  action: (
    prev: JourneyEventActionResult | null,
    formData: FormData,
  ) => Promise<JourneyEventActionResult | null>;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <input type="hidden" name="journey_id" value={journeyId} />

      {state && !state.success && (
        <div className="rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="category" className="field-label">
          Categoria *
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue="CONTACT"
          className="field-input"
        >
          {ALL_JOURNEY_EVENT_CATEGORIES.filter((c) => c !== "JOURNEY").map((cat) => (
            <option key={cat} value={cat}>
              {JOURNEY_EVENT_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        {state && !state.success && state.fieldErrors?.category && (
          <p className="field-error">{state.fieldErrors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="field-label">
          Título *
        </label>
        <input id="title" name="title" required className="field-input" placeholder="Resumo do acontecimento" />
        {state && !state.success && state.fieldErrors?.title && (
          <p className="field-error">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="field-input"
          placeholder="Descreva objetivamente o que aconteceu"
        />
      </div>

      <div>
        <label htmlFor="journey_impact" className="field-label">
          Impacto na Jornada
        </label>
        <textarea
          id="journey_impact"
          name="journey_impact"
          rows={2}
          className="field-input"
          placeholder="Por que este acontecimento é relevante?"
        />
      </div>

      <div>
        <label htmlFor="next_step" className="field-label">
          Próximo passo
        </label>
        <textarea
          id="next_step"
          name="next_step"
          rows={2}
          className="field-input"
          placeholder="O que deverá acontecer depois?"
        />
      </div>

      <div>
        <label htmlFor="occurred_at" className="field-label">
          Data e horário do acontecimento *
        </label>
        <input
          id="occurred_at"
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={defaultDateTimeLocal()}
          className="field-input"
        />
        {state && !state.success && state.fieldErrors?.occurred_at && (
          <p className="field-error">{state.fieldErrors.occurred_at}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_highlighted" className="rounded" />
        Destacar na Timeline
      </label>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Registrar acontecimento"}
        </button>
      </div>
    </form>
  );
}
