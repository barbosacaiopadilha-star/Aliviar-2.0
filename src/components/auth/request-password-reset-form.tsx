"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import { requestPasswordResetAction, type ActionResult } from "@/modules/auth/actions";
import { requestPasswordResetSchema } from "@/modules/auth/schema";

const GENERIC_SUCCESS_MESSAGE =
  "Se o e-mail existir em nossa base, você receberá instruções para redefinir sua senha.";

export function RequestPasswordResetForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    requestPasswordResetAction,
    undefined,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = requestPasswordResetSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    // SEM `startTransition` em volta: a dispatch de `useActionState` já roda
    // em transição própria, e a segunda ficava pendente para sempre —
    // `isPending` travado em `true`, estado nunca comitado. Na tela: botão
    // girando sem parar e nenhuma mensagem, com a escrita já feita.
    formAction(formData);
  }

  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail para receber instruções de redefinição."
      footer={
        <Link
          href="/login"
          className="font-medium text-brand-primary transition-colors hover:text-brand-primary-deep"
        >
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />

        {state?.success ? (
          <FormMessage variant="success">{GENERIC_SUCCESS_MESSAGE}</FormMessage>
        ) : null}

        {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}

        <Button type="submit" isLoading={isPending}>
          Enviar instruções
        </Button>
      </form>
    </AuthCard>
  );
}
