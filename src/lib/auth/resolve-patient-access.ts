import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PatientAccessState =
  | { status: "unauthenticated" }
  | { status: "session_invalid" }
  | { status: "not_patient" }
  | { status: "patient"; patientId: string; authUserId: string; email: string | null };

export async function resolvePatientAccess(
  existingClient?: SupabaseClient,
): Promise<PatientAccessState> {
  const supabase = existingClient ?? (await createClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { status: "session_invalid" };
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, auth_user_id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (patientError || !patient) {
    return { status: "not_patient" };
  }

  return {
    status: "patient",
    patientId: patient.id,
    authUserId: user.id,
    email: patient.email,
  };
}

export async function linkPatientAuthByEmail(
  supabase: SupabaseClient,
  authUserId: string,
  email: string,
): Promise<string | null> {
  const { data: patient, error } = await supabase
    .from("patients")
    .update({ auth_user_id: authUserId })
    .eq("email", email)
    .is("auth_user_id", null)
    .select("id")
    .maybeSingle();

  if (error || !patient) {
    return null;
  }

  return patient.id;
}
