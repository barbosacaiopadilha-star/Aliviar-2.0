import { Suspense } from "react";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/auth/auth-card";
import { getSafeRedirectPath } from "@/modules/auth/redirect-safety";
import { getRoleHome } from "@/modules/auth/role-home";
import { getAuthState } from "@/modules/auth/session";

export const metadata: Metadata = {
  title: "Entrar",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authState = await getAuthState();

  if (authState) {
    redirect(getSafeRedirectPath(params.next, getRoleHome(authState.roles)));
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
