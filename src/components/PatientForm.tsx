import type { Profile } from "@/lib/types/database";
import { PatientFormFields, JourneyFormSection } from "@/components/JourneyFormSection";

export function PatientForm({
  managers,
  action,
  fieldErrors = {},
  submitLabel = "Cadastrar paciente e Jornada",
}: {
  managers: Profile[];
  action: (formData: FormData) => void | Promise<void>;
  fieldErrors?: Record<string, string>;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <PatientFormFields fieldErrors={fieldErrors} />
      <JourneyFormSection managers={managers} fieldErrors={fieldErrors} />
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function NewJourneyForm({
  patientId,
  managers,
  action,
}: {
  patientId: string;
  managers: Profile[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="patient_id" value={patientId} />
      <JourneyFormSection managers={managers} prefix="" />
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          Criar Jornada
        </button>
      </div>
    </form>
  );
}
