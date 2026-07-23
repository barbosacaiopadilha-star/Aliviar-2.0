import type { OperationalStage } from "../jornada/operational-stage";

export type KernelRole =
  | "PATIENT"
  | "CURATOR"
  | "OPERATION"
  | "MANAGER"
  | "ADMIN"
  | "AUDITOR";

export const KERNEL_ROLES: readonly KernelRole[] = [
  "PATIENT",
  "CURATOR",
  "OPERATION",
  "MANAGER",
  "ADMIN",
  "AUDITOR",
];

export type KernelPermission =
  | "journey.create"
  | "journey.read"
  | "journey.advance"
  | "journey.block"
  | "journey.resume"
  | "journey.close"
  | "journey.events.read"
  | "journey.events.write"
  | "journey.commitments.read"
  | "journey.commitments.create"
  | "journey.commitments.complete"
  | "journey.timeline.read";

export const KERNEL_PERMISSION_MATRIX: Record<KernelPermission, readonly KernelRole[]> = {
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
};

/** Pap├®is autorizados a avan├ºar cada etapa operacional. */
export const STAGE_ADVANCE_ROLES: Record<OperationalStage, readonly KernelRole[]> = {
  CADASTRO: ["PATIENT", "OPERATION", "MANAGER", "ADMIN"],
  HISTORIA: ["PATIENT", "OPERATION", "MANAGER", "ADMIN"],
  ACE: ["CURATOR", "OPERATION", "MANAGER", "ADMIN"],
  CURADORIA: ["CURATOR", "ADMIN"],
  ENTREGA: ["CURATOR", "ADMIN"],
  ESCOLHA: ["PATIENT", "OPERATION", "MANAGER", "ADMIN"],
  ACOMPANHAMENTO: ["OPERATION", "MANAGER", "ADMIN"],
  RELACIONAMENTO: ["OPERATION", "MANAGER", "ADMIN"],
  ENCERRADO: [],
};

export function kernelRoleHasPermission(role: KernelRole, permission: KernelPermission): boolean {
  return KERNEL_PERMISSION_MATRIX[permission].includes(role);
}

export function canAdvanceStage(role: KernelRole, stage: OperationalStage): boolean {
  return STAGE_ADVANCE_ROLES[stage].includes(role);
}
