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
      /* Copy da maquete do Fundador (27/08). O título deixa de ser o verbo
         seco e passa a nomear o lugar: quem chega aqui volta para a PRÓPRIA
         área, não executa uma operação. */
      title="Entre na sua área Aliviar"
      description="Acompanhe sua curadoria, consultas e próximos passos."
      footer={
        /* Só o caminho de volta. Na maquete o rodapé tem uma linha, e as duas
           ações — entrar e pedir acesso — vivem no corpo, empilhadas.
           "Esqueci minha senha" também subiu, para junto do campo de senha,
           que é onde a dúvida acontece.
           min-h-11: o alvo de toque media 17px — abaixo até do mínimo de 24px
           (WCAG 2.5.8). Achado da auditoria de interação, 2026-07-24. */
        <Link href="/" className="inline-flex min-h-11 items-center">
          Voltar ao site
        </Link>
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

        <div className="flex justify-end">
          <Link href="/recuperar-senha" className="inline-flex min-h-11 items-center text-sm">
            Esqueci minha senha
          </Link>
        </div>

        {state && !state.success ? <FormMessage variant="error">{state.error}</FormMessage> : null}

        <Button type="submit" isLoading={isPending} className="w-full">
          Entrar
        </Button>

        {/* A segunda ação da maquete dizia "Primeiro acesso". NÃO uso essa
            palavra: ela promete uma ativação de conta que não existe. Na
            Aliviar quem cria o acesso é a equipe, e o "primeiro acesso" de
            quem já tem conta é simplesmente entrar (ADR-064).
            Cheguei a escrever "Ainda não tenho acesso" — e a guarda T-A-1
            recusou, com razão: as QUATRO superfícies públicas dizem o mesmo
            convite, para a pessoa reconhecer a porta em qualquer lugar onde
            a encontre. Inventar um rótulo só aqui quebraria isso, e o texto
            canônico já resolve o que eu queria: não promete ativação
            nenhuma. A casa deu resposta melhor que a minha. */}
        <Link
          href="/solicitar-atendimento"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[0.875rem] border border-[color-mix(in_srgb,var(--color-bg-canvas)_38%,transparent)] px-5 text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--color-bg-canvas)_10%,transparent)]"
        >
          Solicitar atendimento
        </Link>
      </form>
    </AuthCard>
  );
}
