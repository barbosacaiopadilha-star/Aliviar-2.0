import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { linkPatientAfterAuth } from "@/lib/actions/patient-auth";
import { logAuthEventWithAudit } from "@/lib/auth/auth-log";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const isPortal = searchParams.get("portal") === "1";
  const next = searchParams.get("next") ?? (isPortal ? "/portal" : "/workspace");

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next.startsWith("/") ? next : isPortal ? "/portal" : "/workspace";
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");
  redirectTo.searchParams.delete("portal");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      if (isPortal) {
        await linkPatientAfterAuth(supabase);
        await logAuthEventWithAudit({
          step: "patient_login_confirm",
          hasSession: true,
          actorRole: "PATIENT",
          route: next,
        });
      } else {
        await logAuthEventWithAudit({
          step: "staff_login_confirm",
          hasSession: true,
          actorRole: "STAFF",
          route: next,
        });
      }
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = isPortal ? "/portal/entrar" : "/auth/forgot-password";
  redirectTo.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(redirectTo);
}
