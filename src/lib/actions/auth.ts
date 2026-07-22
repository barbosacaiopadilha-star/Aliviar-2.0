"use server";



import { headers } from "next/headers";

import { redirect } from "next/navigation";

import { loginErrorCodeFromAccess } from "@/lib/auth/access-state";

import { logAuthEvent, maskedUserId } from "@/lib/auth/auth-log";

import {

  buildLoginUrl,

  mapSupabaseSignInError,

  type AuthErrorCode,

} from "@/lib/auth/error-codes";

import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";

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

    redirectTo: `${origin}/auth/confirm?next=/auth/reset-password`,

  });



  redirect("/auth/forgot-password?sent=1");

}



export async function signOutAction() {

  const supabase = await createClient();

  await supabase.auth.signOut();

  logAuthEvent({ step: "sign_out", hasSession: false });

  redirect("/login");

}



export async function signInAction(formData: FormData) {

  const email = String(formData.get("email") ?? "").trim();

  const password = String(formData.get("password") ?? "");

  const redirectTo = String(formData.get("redirect") ?? "/workspace");

  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/workspace";



  if (!email || !password) {

    redirect(buildLoginUrl({ error: "missing_credentials", email, redirect: safeRedirect }));

  }



  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });



  if (error) {

    const errorCode = mapSupabaseSignInError(error.message);

    logAuthEvent({ step: "sign_in", code: errorCode, hasSession: false });

    redirect(buildLoginUrl({ error: errorCode, email, redirect: safeRedirect }));

  }



  if (!data.session) {

    await supabase.auth.signOut();

    logAuthEvent({ step: "sign_in", code: "session_expired", hasSession: false });

    redirect(buildLoginUrl({ error: "session_expired", email, redirect: safeRedirect }));

  }



  const access = await resolveStaffAccess(supabase);

  const accessError = loginErrorCodeFromAccess(access);



  if (accessError) {

    await supabase.auth.signOut();

    logAuthEvent({ step: "sign_in_post_auth", code: accessError, hasSession: false });

    redirect(buildLoginUrl({ error: accessError as AuthErrorCode, email, redirect: safeRedirect }));

  }



  logAuthEvent({ step: "sign_in_success", hasSession: true, userIdMasked: maskedUserId(data.user.id) });

  redirect(safeRedirect);

}


