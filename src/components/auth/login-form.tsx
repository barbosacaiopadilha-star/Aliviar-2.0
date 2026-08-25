"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { mapZodFieldErrors } from "@/components/forms/map-zod-field-errors";
import { signInAction, type SignInActionResult } from "@/modules/auth/actions";
import { getSafeRedirectPath } from "@/modules/auth/redirect-safety";
import { getRoleHome } from "@/modules/auth/role-home";
import { signInSchema } from "@/modules/auth/schema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, formAction, isPending] = useActionState<SignInActionResult | undefined, FormData>(
    signInAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      router.push(getSafeRedirectPath(next, getRoleHome(state.roles)));
      router.refresh();
    }
  }, [state, next, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
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
      title="Entrar"
      description="Acesse sua conta na Aliviar Curadoria Médica."
      footer={
        // min-h-11: o alvo de toque media 17px — abaixo até do mínimo AA de
        // 24px (WCAG 2.5.8), num link crítico de recuperação de acesso.
        // Achado da auditoria de interação, 2026-07-24.
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {/* OPS-R3A1 · quem ainda não tem acesso não tem senha a recuperar. A
              porta pública fica ao lado, com o mesmo CTA canônico das demais. */}
          <Link
            href="/solicitar-atendimento"
            className="inline-flex min-h-11 items-center font-medium text-brand-primary transition-colors hover:text-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Solicitar atendimento
          </Link>
          <Link
            href="/recuperar-senha"
            className="inline-flex min-h-11 items-center font-medium text-brand-primary transition-colors hover:text-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Esqueci minha senha
          </Link>
        </div>
      }
    >
      <form action={formAction} onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />
        <Input
          name="password"
          type="password"
          label="Senha"
          autoComplete="current-password"
          required
          error={fieldErrors.password}
        />

        {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}

        <Button type="submit" isLoading={isPending}>
          Entrar
        </Button>
      </form>
    </AuthCard>
  );
}
