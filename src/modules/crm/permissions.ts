import type { CrmRole, InteractionVisibility } from "./types";

export type CrmPermission =
  | "crm.view_all_contacts"
  | "crm.view_queue"
  | "crm.create_contact"
  | "crm.edit_contact"
  | "crm.archive_contact"
  | "crm.assign_responsible"
  | "crm.change_stage"
  | "crm.view_history"
  | "crm.manage_tasks"
  | "crm.manage_appointments"
  | "crm.view_dashboard"
  | "crm.view_settings"
  | "crm.view_audit"
  | "crm.view_restricted_notes"
  | "crm.manage_permissions"
  | "crm.refer_to_curator";

const ROLE_PERMISSIONS: Record<CrmRole, CrmPermission[]> = {
  administrador: [
    "crm.view_all_contacts",
    "crm.view_queue",
    "crm.create_contact",
    "crm.edit_contact",
    "crm.archive_contact",
    "crm.assign_responsible",
    "crm.change_stage",
    "crm.view_history",
    "crm.manage_tasks",
    "crm.manage_appointments",
    "crm.view_dashboard",
    "crm.view_settings",
    "crm.view_audit",
    "crm.view_restricted_notes",
    "crm.manage_permissions",
    "crm.refer_to_curator",
  ],
  concierge: [
    "crm.view_queue",
    "crm.create_contact",
    "crm.edit_contact",
    "crm.archive_contact",
    "crm.change_stage",
    "crm.view_history",
    "crm.manage_tasks",
    "crm.manage_appointments",
    "crm.view_dashboard",
    "crm.refer_to_curator",
  ],
  curador_medico: ["crm.view_history"],
};

export function resolveCrmRoles(roles: string[]): CrmRole[] {
  return roles.filter((role): role is CrmRole => role in ROLE_PERMISSIONS);
}

export function hasCrmPermission(roles: string[], permission: CrmPermission): boolean {
  const crmRoles = resolveCrmRoles(roles);
  return crmRoles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function canAccessCrm(roles: string[]): boolean {
  return resolveCrmRoles(roles).length > 0;
}

export function canViewContact(roles: string[], contact: { assignedTo: string | null }, userId: string): boolean {
  if (hasCrmPermission(roles, "crm.view_all_contacts")) return true;
  if (hasCrmPermission(roles, "crm.view_queue")) {
    return contact.assignedTo === null || contact.assignedTo === userId;
  }
  return false;
}

export function canViewInteraction(roles: string[], visibility: InteractionVisibility): boolean {
  if (visibility === "operacional") return canAccessCrm(roles);
  if (visibility === "restrita") return hasCrmPermission(roles, "crm.view_restricted_notes");
  return hasCrmPermission(roles, "crm.view_audit");
}

export const CRM_OPERATOR_ROLES = ["administrador", "concierge"] as const;

/** Papéis com qualquer acesso ao módulo CRM (inclui curador com escopo limitado via RLS). */
export const CRM_ACCESS_ROLES = ["administrador", "concierge", "curador_medico"] as const;
