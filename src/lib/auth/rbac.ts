import type { GovernancePermission, GovernanceRole } from "@/governance-flow/contracts/rbac";
import { PERMISSION_MATRIX } from "@/governance-flow/contracts/rbac";
import type { UserRole } from "@/lib/types/database";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";

export function mapUserRoleToGovernance(role: UserRole): GovernanceRole {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "CURATOR":
      return "CURADOR";
    case "OPERATION":
    case "MANAGER":
      return "OPERADOR";
    case "AUDITOR":
      return "AUDITOR";
    default:
      return "OPERADOR";
  }
}

export function governanceRoleHasPermission(
  role: GovernanceRole,
  permission: GovernancePermission,
): boolean {
  return PERMISSION_MATRIX[permission].includes(role);
}

export async function resolveGovernanceRole(): Promise<GovernanceRole | null> {
  const staff = await resolveStaffAccess();
  if (staff.status === "active_staff") {
    return mapUserRoleToGovernance(staff.profile.role);
  }

  const patient = await resolvePatientAccess();
  if (patient.status === "patient") {
    return "PACIENTE";
  }

  return null;
}

export async function requireGovernancePermission(
  permission: GovernancePermission,
): Promise<
  | { ok: true; role: GovernanceRole; actorId: string }
  | { ok: false; status: number; message: string }
> {
  const staff = await resolveStaffAccess();
  if (staff.status !== "active_staff") {
    return { ok: false, status: 401, message: "Sessão inválida ou ausente." };
  }

  const role = mapUserRoleToGovernance(staff.profile.role);
  if (!governanceRoleHasPermission(role, permission)) {
    return { ok: false, status: 403, message: "Permissão insuficiente." };
  }

  return { ok: true, role, actorId: staff.profile.id };
}

export function buildPermissionMatrixView() {
  return {
    permissions: (Object.keys(PERMISSION_MATRIX) as GovernancePermission[]).map((permission) => ({
      permission,
      roles: [...PERMISSION_MATRIX[permission]],
    })),
  };
}
