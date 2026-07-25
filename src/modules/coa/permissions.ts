import type { CoaLevel } from "./types";

export type CoaPermission =
  | "coa.view_atendimento"
  | "coa.view_curadoria"
  | "coa.view_concierge"
  | "coa.transfer_to_curadoria"
  | "coa.transfer_to_concierge"
  | "coa.manage_leads"
  | "coa.execute_curadoria"
  | "coa.manage_acompanhamento";

const ROLE_COA_PERMISSIONS: Record<string, CoaPermission[]> = {
  administrador: [
    "coa.view_atendimento",
    "coa.view_curadoria",
    "coa.view_concierge",
    "coa.transfer_to_curadoria",
    "coa.transfer_to_concierge",
    "coa.manage_leads",
    "coa.execute_curadoria",
    "coa.manage_acompanhamento",
  ],
  concierge: [
    "coa.view_atendimento",
    "coa.view_concierge",
    "coa.transfer_to_curadoria",
    "coa.transfer_to_concierge",
    "coa.manage_leads",
    "coa.manage_acompanhamento",
  ],
  curador_medico: ["coa.view_curadoria", "coa.execute_curadoria", "coa.transfer_to_concierge"],
};

const LEVEL_PERMISSION: Record<CoaLevel, CoaPermission> = {
  ATENDIMENTO: "coa.view_atendimento",
  CURADORIA: "coa.view_curadoria",
  CONCIERGE: "coa.view_concierge",
};

export function hasCoaPermission(roles: string[], permission: CoaPermission): boolean {
  return roles.some((role) => ROLE_COA_PERMISSIONS[role]?.includes(permission));
}

export function canAccessCoaLevel(roles: string[], level: CoaLevel): boolean {
  return hasCoaPermission(roles, LEVEL_PERMISSION[level]);
}

export function resolveDefaultCoaLevel(roles: string[]): CoaLevel | null {
  if (roles.includes("curador_medico")) return "CURADORIA";
  // ONE ALIVIAR: o Concierge é Nível 3 — o nível dele, nunca o Atendimento
  // (resíduo de quando o papel operava a fila do CRM).
  if (roles.includes("concierge")) return "CONCIERGE";
  if (roles.includes("administrador")) return "ATENDIMENTO";
  return null;
}

// ONE ALIVIAR: as homes de nível são as jornadas auditadas — o mesmo destino
// do hub /coa e do ROLE_HOME, nunca um terceiro mapa que possa divergir.
const COA_LEVEL_HOMES: Record<CoaLevel, string> = {
  ATENDIMENTO: "/atendimento",
  CURADORIA: "/coa/curadoria",
  CONCIERGE: "/acompanhamento",
};

export function resolveCoaHomePath(roles: string[]): string {
  const level = resolveDefaultCoaLevel(roles);
  if (!level) return "/acesso-negado";
  return COA_LEVEL_HOMES[level];
}
