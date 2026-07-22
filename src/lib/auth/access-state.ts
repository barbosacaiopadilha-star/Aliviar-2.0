import type { AuthErrorCode } from "@/lib/auth/error-codes";
import type { Profile, UserRole } from "@/lib/types/database";

export const STAFF_ROLES: readonly UserRole[] = [
  "ADMIN",
  "MANAGER",
  "CURATOR",
  "OPERATION",
  "AUDITOR",
];

export type StaffAccessState =
  | { status: "unauthenticated" }
  | { status: "session_invalid" }
  | { status: "authenticated_without_profile"; userId: string }
  | { status: "inactive_profile"; userId: string; profileId: string }
  | { status: "active_staff"; userId: string; profile: Profile }
  | { status: "invalid_profile"; reason: "duplicate_profile" | "invalid_role" }
  | { status: "error"; code: string };

export function isStaffRole(role: string): role is UserRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function resolveStaffAccessFromProfiles(
  userId: string,
  profiles: Profile[],
): StaffAccessState {
  if (profiles.length === 0) {
    return { status: "authenticated_without_profile", userId };
  }

  if (profiles.length > 1) {
    return { status: "invalid_profile", reason: "duplicate_profile" };
  }

  const profile = profiles[0];

  if (!isStaffRole(profile.role)) {
    return { status: "invalid_profile", reason: "invalid_role" };
  }

  if (!profile.is_active) {
    return {
      status: "inactive_profile",
      userId,
      profileId: profile.id,
    };
  }

  return { status: "active_staff", userId, profile };
}

export function loginErrorCodeFromAccess(state: StaffAccessState): AuthErrorCode | null {
  switch (state.status) {
    case "active_staff":
      return null;
    case "authenticated_without_profile":
      return "no_active_profile";
    case "inactive_profile":
      return "inactive_profile";
    case "invalid_profile":
      return state.reason === "invalid_role" ? "invalid_role" : "unexpected_auth_error";
    case "session_invalid":
    case "unauthenticated":
      return "session_expired";
    case "error":
      return "auth_unavailable";
    default:
      return "unexpected_auth_error";
  }
}

export function hasActiveStaffAccess(state: StaffAccessState): boolean {
  return state.status === "active_staff";
}
