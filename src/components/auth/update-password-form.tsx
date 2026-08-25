"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import { updatePasswordAction, type ActionResult } from "@/modules/auth/actions";
import { updatePasswordSchema } from "@/modules/auth/schema";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    updatePasswordAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      router.push("/login");
      router.refresh();
    }
  }, [state, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = updatePasswordSchema.safeParse({
      password: formData.get("password"),
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

  return (
    <AuthCard
      title="Nova senha"
      description="Defina uma nova senha para sua conta."
      footer={
        <Link
          href="/login"
          className="font-medium text-brand-primary transition-colors hover:text-brand-primary-deep"
        >
          Voltar para o login
        </Link>
      }
    >
      <form action={formAction} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          name="password"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          required
          error={fieldErrors.password}
        />

        {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}

        <Button type="submit" isLoading={isPending}>
          Atualizar senha
        </Button>
      </form>
    </AuthCard>
  );
}
