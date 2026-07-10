"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/types/database";
import type { ActionResult } from "@/lib/actions/patients";
import { PatientFormFields, JourneyFormSection } from "@/components/JourneyFormSection";

export function CreatePatientForm({
  managers,
  action,
}: {
  managers: Profile[];
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult | null>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.success && (
        <div className="rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
          {state.error}
        </div>
      )}

      <PatientFormFields fieldErrors={state && !state.success ? state.fieldErrors : undefined} />
      <JourneyFormSection
        managers={managers}
        fieldErrors={state && !state.success ? state.fieldErrors : undefined}
      />

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Salvando..." : "Cadastrar paciente e Jornada"}
        </button>
      </div>
    </form>
  );
}
