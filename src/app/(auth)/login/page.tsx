import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/auth/auth-card";
import { getSafeRedirectPath } from "@/modules/auth/redirect-safety";
import { getAuthState } from "@/modules/auth/session";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

function getDefaultPathForRole(roles: string[]): string {
  if (roles.includes("administrador")) {
    return "/";
  }

  if (roles.includes("profissional")) {
    return "/";
  }

  if (roles.includes("paciente")) {
    return "/";
  }

  return "/";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authState = await getAuthState();

  if (authState) {
    const destination = params.next
      ? getSafeRedirectPath(params.next)
      : getDefaultPathForRole(authState.roles);

    redirect(destination);
  }

  return (
    <Suspense
      fallback={
        <AuthCard title="Entrar" description="Carregando...">
          <p className="text-center text-sm text-gray-500">Aguarde...</p>
        </AuthCard>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
