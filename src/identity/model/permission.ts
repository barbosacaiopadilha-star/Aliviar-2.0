import type { KernelRole } from "@/kernel/rbac/permissions";

/** Permiss├Áes da plataforma ÔÇö estende o kernel com capacidades transversais. */
export type PlatformPermission =
  | import("@/kernel/rbac/permissions").KernelPermission
  | "delivery.publish"
  | "curator.assign"
  | "documents.read"
  | "documents.write"
  | "admin.manage"
  | "audit.read";

export type PlatformRole = KernelRole;
export { KERNEL_ROLES as PLATFORM_ROLES } from "@/kernel/rbac/permissions";

export const PLATFORM_PERMISSION_MATRIX: Record<PlatformPermission, readonly PlatformRole[]> = {
  "journey.create": ["OPERATION", "MANAGER", "ADMIN"],
  "journey.read": ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"],
  "journey.advance": ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.block": ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.resume": ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.close": ["OPERATION", "MANAGER", "ADMIN"],
  "journey.events.read": ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"],
  "journey.events.write": ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.commitments.read": ["CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"],
  "journey.commitments.create": ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.commitments.complete": ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  "journey.timeline.read": ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"],
  "delivery.publish": ["CURATOR", "ADMIN"],
  "curator.assign": ["OPERATION", "MANAGER", "ADMIN"],
  "documents.read": ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"],
  "documents.write": ["PATIENT", "OPERATION", "MANAGER", "ADMIN"],
  "admin.manage": ["ADMIN"],
  "audit.read": ["ADMIN", "AUDITOR"],
};

export function platformRoleHasPermission(
  role: PlatformRole,
  permission: PlatformPermission,
): boolean {
  return PLATFORM_PERMISSION_MATRIX[permission].includes(role);
}

export function permissionsForRole(role: PlatformRole): PlatformPermission[] {
  return (Object.keys(PLATFORM_PERMISSION_MATRIX) as PlatformPermission[]).filter((permission) =>
    platformRoleHasPermission(role, permission),
  );
}
