import type { PlatformRole } from "./permission";

/** Identidade operacional ÔÇö papel e escopo dentro da plataforma. */
export interface Identity {
  userId: string;
  role: PlatformRole;
  isActive: boolean;
  staffProfileId?: string;
  patientId?: string;
  teamId?: string;
  displayName?: string | null;
}

export function isStaffIdentity(identity: Identity): boolean {
  return identity.role !== "PATIENT";
}

export function isPatientIdentity(identity: Identity): boolean {
  return identity.role === "PATIENT";
}
