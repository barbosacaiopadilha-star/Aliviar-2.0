import type { KernelActor } from "@/kernel/rbac/authorization";

import type { Identity } from "./identity";
import type { PlatformRole } from "./permission";

/** Ator de uma requisi├º├úo ÔÇö identidade resolvida pronta para autoriza├º├úo. */
export interface Actor {
  id: string;
  role: PlatformRole;
  patientId?: string;
  staffProfileId?: string;
}

export function actorFromIdentity(identity: Identity): Actor {
  return {
    id: identity.staffProfileId ?? identity.userId,
    role: identity.role,
    patientId: identity.patientId,
    staffProfileId: identity.staffProfileId,
  };
}

export function toKernelActor(actor: Actor): KernelActor {
  return {
    id: actor.id,
    role: actor.role,
    patientId: actor.patientId,
  };
}
