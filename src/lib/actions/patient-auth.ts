"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { linkPatientAuthByEmail } from "@/lib/auth/resolve-patient-access";
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

export async function requestPatientMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const redirectTo = String(formData.get("redirect") ?? "/portal");

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/portal";

  if (!email) {
    redirect(`/portal/entrar?error=missing_email&redirect=${encodeURIComponent(safeRedirect)}`);
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeRedirect)}&portal=1`,
    },
  });

  redirect(`/portal/entrar?sent=1&email=${encodeURIComponent(email)}`);
}

export async function linkPatientAfterAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return;
  }

  await linkPatientAuthByEmail(supabase, user.id, user.email);
}
