import type { KernelPermission, KernelRole } from "./permissions";
import {
  canAdvanceStage,
  kernelRoleHasPermission,
} from "./permissions";
import type { OperationalStage } from "../jornada/operational-stage";

export interface KernelActor {
  id: string;
  role: KernelRole;
  patientId?: string;
}

export type AuthorizationFailureReason = "FORBIDDEN" | "OWNERSHIP_REQUIRED";

export interface AuthorizationSuccess {
  ok: true;
  actor: KernelActor;
}

export interface AuthorizationFailure {
  ok: false;
  reason: AuthorizationFailureReason;
  message: string;
}

export type AuthorizationResult = AuthorizationSuccess | AuthorizationFailure;

export function authorize(
  actor: KernelActor,
  permission: KernelPermission,
): AuthorizationResult {
  if (!kernelRoleHasPermission(actor.role, permission)) {
    return {
      ok: false,
      reason: "FORBIDDEN",
      message: `Papel ${actor.role} n├úo possui permiss├úo ${permission}.`,
    };
  }

  return { ok: true, actor };
}

export function authorizePatientOwnership(
  actor: KernelActor,
  journeyPatientId: string,
): AuthorizationResult {
  if (actor.role !== "PATIENT") {
    return { ok: true, actor };
  }

  if (!actor.patientId || actor.patientId !== journeyPatientId) {
    return {
      ok: false,
      reason: "OWNERSHIP_REQUIRED",
      message: "Paciente s├│ pode acessar a pr├│pria jornada.",
    };
  }

  return { ok: true, actor };
}

export function authorizeStageAdvance(
  actor: KernelActor,
  currentStage: OperationalStage,
  journeyPatientId: string,
): AuthorizationResult {
  const permission = authorize(actor, "journey.advance");
  if (!permission.ok) {
    return permission;
  }

  const ownership = authorizePatientOwnership(actor, journeyPatientId);
  if (!ownership.ok) {
    return ownership;
  }

  if (!canAdvanceStage(actor.role, currentStage)) {
    return {
      ok: false,
      reason: "FORBIDDEN",
      message: `Papel ${actor.role} n├úo pode avan├ºar a etapa ${currentStage}.`,
    };
  }

  return { ok: true, actor };
}
