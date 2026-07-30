"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  requestPasswordResetSchema,
  signInSchema,
  updatePasswordSchema,
} from "./schema";
import { getAuthState } from "./session";

export type ActionResult = { success: true } | { success: false; error: string };

// Tipo próprio (não reaproveita ActionResult): só o login precisa informar
// os papéis resolvidos, para o cliente decidir o destino padrão pós-login
// quando não há `next` (ver src/modules/auth/role-home.ts).
export type SignInActionResult =
  | { success: true; roles: string[] }
  | { success: false; error: string };

async function getOrigin(): Promise<string> {
  const headerList = await headers();
  return headerList.get("origin") ?? "http://localhost:3000";
}

export async function signInAction(
  _prevState: SignInActionResult | undefined,
  formData: FormData,
): Promise<SignInActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "Preencha e-mail e senha válidos." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: "Credenciais inválidas." };
  }

  const state = await getAuthState();
  return { success: true, roles: state?.roles ?? [] };
}

export async function signOutAction(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  // Sessão ausente ou já expirada NÃO é falha de logout: a pessoa queria
  // estar deslogada e já está. Tratar isso como erro produzia um
  // "?error=logout" assustador exatamente para quem clicou Sair duas vezes
  // ou voltou de uma aba antiga. Só falha real de revogação vira erro.
  if (error && !/session/i.test(error.message ?? "")) {
    redirect("/login?error=logout");
  }

  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: "Informe um e-mail válido." };
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/nova-senha`,
  });

  // O Supabase Auth não informa se o e-mail existe ou não (evita enumeração
  // de contas) — um erro aqui é sempre um problema real de configuração/rede,
  // não "e-mail não encontrado".
  if (error) {
    return { success: false, error: "Não foi possível processar a solicitação." };
  }

  return { success: true };
}

export async function updatePasswordAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "A senha precisa ter ao menos 8 caracteres." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { success: false, error: "Não foi possível atualizar a senha." };
  }

  return { success: true };
}
