export type GovernanceRole = "ADMIN" | "CURADOR" | "OPERADOR" | "AUDITOR" | "PACIENTE";

export type GovernancePermission =
  | "admin.config.read"
  | "admin.config.write"
  | "admin.users.read"
  | "admin.users.write"
  | "admin.permissions.read"
  | "admin.flags.read"
  | "admin.flags.write"
  | "admin.health.read"
  | "admin.audit.read"
  | "admin.quality.read"
  | "admin.quality.write";

export const GOVERNANCE_ROLE_LABELS: Record<GovernanceRole, string> = {
  ADMIN: "Administrador",
  CURADOR: "Curador",
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
  PACIENTE: "Paciente",
};

export const PERMISSION_MATRIX: Record<GovernancePermission, readonly GovernanceRole[]> = {
  "admin.config.read": ["ADMIN", "AUDITOR"],
  "admin.config.write": ["ADMIN"],
  "admin.users.read": ["ADMIN", "AUDITOR"],
  "admin.users.write": ["ADMIN"],
  "admin.permissions.read": ["ADMIN", "AUDITOR"],
  "admin.flags.read": ["ADMIN", "AUDITOR"],
  "admin.flags.write": ["ADMIN"],
  "admin.health.read": ["ADMIN", "AUDITOR", "OPERADOR"],
  "admin.audit.read": ["ADMIN", "AUDITOR"],
  "admin.quality.read": ["ADMIN", "AUDITOR", "OPERADOR"],
  "admin.quality.write": ["ADMIN", "OPERADOR"],
};

export interface PermissionMatrixView {
  permissions: Array<{
    permission: GovernancePermission;
    roles: GovernanceRole[];
  }>;
}
