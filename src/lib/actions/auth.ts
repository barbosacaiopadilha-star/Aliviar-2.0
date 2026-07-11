"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getRequestOrigin() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/auth/forgot-password?error=missing_email");
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  redirect("/auth/forgot-password?sent=1");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/workspace");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  redirect(redirectTo.startsWith("/") ? redirectTo : "/workspace");
}
