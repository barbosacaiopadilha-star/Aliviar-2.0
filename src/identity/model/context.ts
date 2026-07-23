import type { JourneyScope } from "../projection/journey-scope";
import type { Actor } from "./actor";
import type { Identity } from "./identity";
import type { PlatformPermission } from "./permission";
import type { Session } from "./session";

/** Contexto completo de uma requisi├º├úo ÔÇö ├║nica fonte para autoriza├º├úo. */
export interface PlatformContext {
  session: Session;
  identity: Identity | null;
  actor: Actor | null;
  permissions: readonly PlatformPermission[];
  journeyScope: JourneyScope;
}

export function hasIdentity(context: PlatformContext): context is PlatformContext & {
  identity: Identity;
  actor: Actor;
} {
  return context.identity !== null && context.actor !== null && context.identity.isActive;
}
