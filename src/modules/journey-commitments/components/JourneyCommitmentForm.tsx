"use client";

import { useActionState, useEffect } from "react";
import type { Profile } from "@/lib/types/database";
import type { CommitmentActionResult } from "@/modules/journey-commitments/actions/commitments";
import { USER_ROLE_LABELS } from "@/lib/types/database";

function defaultDueDateMin() {
  return new Date().toISOString().slice(0, 10);
}

export function JourneyCommitmentForm({
  journeyId,
  staff,
  action,
  onSuccess,
}: {
  journeyId: string;
  staff: Profile[];
  action: (
    prev: CommitmentActionResult | null,
    formData: FormData,
  ) => Promise<CommitmentActionResult | null>;
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
        <label htmlFor="title" className="field-label">
          Descrição do compromisso *
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={200}
          className="field-input"
          placeholder="Ex.: Entrar em contato com o paciente para confirmar exames"
        />
        {state && !state.success && state.fieldErrors?.title && (
          <p className="field-error">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="assigned_to" className="field-label">
          Responsável *
        </label>
        <select id="assigned_to" name="assigned_to" required className="field-input">
          <option value="">Selecione o responsável</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name} — {USER_ROLE_LABELS[member.role]}
            </option>
          ))}
        </select>
        {state && !state.success && state.fieldErrors?.assigned_to && (
          <p className="field-error">{state.fieldErrors.assigned_to}</p>
        )}
      </div>

      <div>
        <label htmlFor="due_date" className="field-label">
          Prazo (opcional)
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          min={defaultDueDateMin()}
          className="field-input"
        />
        {state && !state.success && state.fieldErrors?.due_date && (
          <p className="field-error">{state.fieldErrors.due_date}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Adicionar compromisso"}
        </button>
      </div>
    </form>
  );
}
