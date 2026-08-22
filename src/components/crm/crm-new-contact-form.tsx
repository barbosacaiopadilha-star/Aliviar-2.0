"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createContactAction } from "@/modules/crm/actions";
import { CONTACT_SOURCE_LABELS } from "@/modules/crm/types";

export function CrmNewContactForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setDuplicateWarning(null);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      source: String(formData.get("source") ?? "outro"),
      initialReason: String(formData.get("initialReason") ?? ""),
      consentStatus: formData.get("consentGranted") === "on" ? "concedido" : "pendente",
      acknowledgeDuplicates: formData.get("acknowledgeDuplicates") === "on",
    };

    startTransition(async () => {
      const result = await createContactAction(payload);
      if (!result.success) {
        if (result.duplicates?.length) {
          setDuplicateWarning(
            `Possíveis duplicidades: ${result.duplicates.map((d) => d.contact.fullName).join(", ")}. Marque a confirmação para prosseguir.`,
          );
        }
        setError(result.error);
        return;
      }
      router.push(`/atendimento/${result.contactId}`);
    });
  }

  return (
    <Card>
      <form action={onSubmit} className="space-y-4">
        <Input name="fullName" label="Nome completo" required />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="phone" label="Telefone" />
          <Input name="email" label="E-mail" type="email" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="city" label="Cidade" />
          <Input name="state" label="UF" maxLength={2} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="source">
            Origem
          </label>
          <Select id="source" name="source" defaultValue="outro" required>
            {Object.entries(CONTACT_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="initialReason">
            Observação inicial
          </label>
          <Textarea id="initialReason" name="initialReason" rows={4} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="consentGranted" />
          Consentimento registrado
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="acknowledgeDuplicates" />
          Confirmo que revisei possíveis duplicidades
        </label>
        {duplicateWarning ? <p className="text-sm text-amber-700">{duplicateWarning}</p> : null}
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <Button type="submit" isLoading={isPending} fullWidth>
          Salvar contato
        </Button>
      </form>
    </Card>
  );
}
