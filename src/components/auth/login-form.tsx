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
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setFieldErrors(mapZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    formAction(formData);
  }

  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua conta no Aliviar Conexão."
      footer={
        <Link href="/recuperar-senha" className="text-teal-700 hover:text-teal-800">
          Esqueci minha senha
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
