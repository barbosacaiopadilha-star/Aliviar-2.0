"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import { adminPatientProfileSchema } from "@/modules/profiles/patient-account-schema";
import type { ActionResult } from "@/modules/profiles/types";

import { BRAZILIAN_STATES } from "./brazilian-states";

type AdminPatientProfileFormProps = {
  action: (prevState: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  initialPhone: string;
  initialCity: string;
  initialState: string;
};

export function AdminPatientProfileForm({
  action,
  initialPhone,
  initialCity,
  initialState,
}: AdminPatientProfileFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = adminPatientProfileSchema.safeParse({
      phone: formData.get("phone"),
      city: formData.get("city"),
      state: formData.get("state"),
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
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        name="phone"
        type="tel"
        label="Telefone"
        defaultValue={initialPhone}
        error={fieldErrors.phone}
      />

      <Input
        name="city"
        type="text"
        label="Cidade"
        defaultValue={initialCity}
        error={fieldErrors.city}
      />

      <FormField label="Estado" htmlFor="admin-patient-state" error={fieldErrors.state}>
        <Select
          id="admin-patient-state"
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

      {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      {state?.success ? <FormMessage variant="success">Dados salvos com sucesso.</FormMessage> : null}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Salvar dados
      </Button>
    </form>
  );
}
