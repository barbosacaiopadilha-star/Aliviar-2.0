import { resolveStaffAccessFromProfiles, type StaffAccessState } from "@/lib/auth/access-state";
import { logAuthEvent, maskedUserId } from "@/lib/auth/auth-log";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveStaffAccess(
  existingClient?: SupabaseClient,
): Promise<StaffAccessState> {
  const supabase = existingClient ?? (await createClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logAuthEvent({
      step: "resolve_access",
      code: "session_invalid",
      hasSession: false,
    });
    return { status: "session_invalid" };
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  if (dbError) {
    logAuthEvent({
      step: "resolve_access",
      code: "profile_query_failed",
      hasSession: true,
      userIdMasked: maskedUserId(user.id),
    });
    return { status: "error", code: "profile_query_failed" };
  }

  const state = resolveStaffAccessFromProfiles(user.id, (data ?? []) as Profile[]);

  logAuthEvent({
    step: "resolve_access",
    code: state.status,
    hasSession: true,
    userIdMasked: maskedUserId(user.id),
  });

  return state;
}
