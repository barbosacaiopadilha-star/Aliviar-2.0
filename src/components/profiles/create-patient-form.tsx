"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import {
  createPatientAccountAction,
  type CreatePatientAccountActionResult,
} from "@/modules/profiles/patient-account-actions";
import { createPatientAccountSchema } from "@/modules/profiles/patient-account-schema";

import { CredentialsReveal } from "./credentials-reveal";

export function CreatePatientForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Chave estável da SOLICITAÇÃO (Bloco B.6/B3): nasce uma única vez, no
  // render do formulário, e acompanha cada reenvio — um retry após falha
  // repete a MESMA chave e o servidor recupera a operação em vez de criar
  // (ou esbarrar em) uma segunda conta. Um formulário novo = solicitação
  // nova = chave nova.
  const [operationKey] = useState(() => crypto.randomUUID());
  const [state, formAction, isPending] = useActionState<
    CreatePatientAccountActionResult | undefined,
    FormData
  >(createPatientAccountAction, undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = createPatientAccountSchema.safeParse({
      email: formData.get("email"),
      displayName: formData.get("displayName"),
      operationKey: formData.get("operationKey"),
    });

    if (!parsed.success) {
      event.preventDefault();
      setFieldErrors(mapZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    // O DISPATCH É DO FORM, NÃO NOSSO (conserto de 25/08 — curadoria
    // simulada; o Fundador ficou preso na tela de Entrar). Chamar
    // `formAction(formData)` na mão, fora de transição, é o que o React 19
    // não garante: o resultado da action pode nunca comitar, e o clique
    // "não faz nada", sem erro, de forma intermitente — era o aviso
    // `useActionState ... outside of a transition` no console. A action
    // vive no atributo `action` do form (o React a despacha na transição
    // correta) e este onSubmit SÓ VALIDA: bloqueia com preventDefault
    // apenas quando o zod reprova.
  }

  if (state?.success) {
    return (
      <div className="space-y-6">
        <CredentialsReveal email={state.email} password={state.password} />
        <Link
          href="/admin/pacientes"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-fast ease-standard hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto"
        >
          Concluir
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-5">
      <input type="hidden" name="operationKey" value={operationKey} />

      <Input
        name="displayName"
        type="text"
        label="Nome do paciente"
        autoComplete="name"
        required
        error={fieldErrors.displayName}
      />

      <Input
        name="email"
        type="email"
        label="E-mail (será o login)"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />

      {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Criar paciente e gerar senha
      </Button>
    </form>
  );
}
