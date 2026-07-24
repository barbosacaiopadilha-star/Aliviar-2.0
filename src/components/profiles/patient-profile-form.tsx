"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PatientCard, PatientPageHeader } from "@/components/paciente/dashboard/patient-primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import { updatePatientProfileAction } from "@/modules/profiles/patient-actions";
import { patientProfileSchema } from "@/modules/profiles/patient-schema";
import type { ActionResult, CommunicationChannel } from "@/modules/profiles/types";

import { BRAZILIAN_STATES } from "./brazilian-states";

type PatientProfileFormProps = {
  initialPhone: string;
  initialCity: string;
  initialState: string;
  initialPreferredChannel: CommunicationChannel;
  initialAcceptsReminders: boolean;
};

const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  email: "E-mail",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function PatientProfileForm({
  initialPhone,
  initialCity,
  initialState,
  initialPreferredChannel,
  initialAcceptsReminders,
}: PatientProfileFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    updatePatientProfileAction,
    undefined,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = patientProfileSchema.safeParse({
      phone: formData.get("phone"),
      city: formData.get("city"),
      state: formData.get("state"),
      preferredChannel: formData.get("preferredChannel"),
      acceptsReminders: formData.get("acceptsReminders") === "on",
    });

    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="space-y-10">
      <PatientPageHeader
        title="Meu perfil"
        description="Estes dados ajudam a Aliviar a te acompanhar melhor. Nenhuma informação de saúde é guardada aqui."
      />

      <PatientCard>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          name="phone"
          type="tel"
          label="Telefone"
          autoComplete="tel"
          inputMode="tel"
          defaultValue={initialPhone}
          error={fieldErrors.phone}
        />

        <Input
          name="city"
          type="text"
          label="Cidade"
          autoComplete="address-level2"
          defaultValue={initialCity}
          error={fieldErrors.city}
        />

        <FormField label="Estado" htmlFor="state" error={fieldErrors.state}>
          <Select
            id="state"
            name="state"
            defaultValue={initialState}
            error={Boolean(fieldErrors.state)}
          >
            <option value="">Selecione</option>
            {BRAZILIAN_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Canal de comunicação preferido" htmlFor="preferredChannel">
          <Select id="preferredChannel" name="preferredChannel" defaultValue={initialPreferredChannel}>
            {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>

        <Checkbox
          name="acceptsReminders"
          label="Quero receber lembretes da Aliviar"
          defaultChecked={initialAcceptsReminders}
        />

        {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}
        {state?.success ? (
          <FormMessage variant="success">Perfil salvo com sucesso.</FormMessage>
        ) : null}

        <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
          Salvar
        </Button>
      </form>
      </PatientCard>
    </div>
  );
}
