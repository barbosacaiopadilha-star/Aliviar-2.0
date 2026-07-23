import { AuthorizationService } from "../authorization/authorization-service";
import { actorFromIdentity } from "../model/actor";
import type { PlatformContext } from "../model/context";
import { permissionsForRole } from "../model/permission";
import type { Session } from "../model/session";
import { isAuthenticated } from "../model/session";
import type { AuthProviderPort } from "../ports/auth-provider-port";
import type { JourneyScopePort } from "../ports/journey-scope-port";
import { projectJourneyScope } from "../projection/journey-projection";
import type { JourneyRecord } from "../projection/journey-scope";
import { unauthenticatedSession } from "../model/session";

export interface ResolveSessionContextDeps {
  authProvider: AuthProviderPort;
  journeyScopePort?: JourneyScopePort;
  journeyCatalog?: JourneyRecord[];
}

const EMPTY_SCOPE = { type: "none" } as const;

/**
 * Resolve o contexto completo de uma requisi├º├úo:
 * usu├írio, papel, escopo de jornada e permiss├Áes efetivas.
 */
export async function resolveSessionContext(
  deps: ResolveSessionContextDeps,
): Promise<PlatformContext> {
  const session = await deps.authProvider.resolveSession();

  if (!isAuthenticated(session) || !session.user) {
    return {
      session,
      identity: null,
      actor: null,
      permissions: [],
      journeyScope: EMPTY_SCOPE,
    };
  }

  const identity = await deps.authProvider.resolveIdentity(session);

  if (!identity || !identity.isActive) {
    return {
      session,
      identity,
      actor: null,
      permissions: [],
      journeyScope: EMPTY_SCOPE,
    };
  }

  const journeyScope = deps.journeyScopePort
    ? await deps.journeyScopePort.resolveScope(identity)
    : projectJourneyScope(identity, {
        allJourneys: deps.journeyCatalog,
      });

  const actor = actorFromIdentity(identity);
  const permissions = permissionsForRole(identity.role);

  return {
    session,
    identity,
    actor,
    permissions,
    journeyScope,
  };
}

export function createAuthorizationService(context: PlatformContext): AuthorizationService {
  return new AuthorizationService(context);
}

/** Contexto vazio para testes e fallbacks. */
export function emptyPlatformContext(provider: Session["provider"] = "supabase"): PlatformContext {
  return {
    session: unauthenticatedSession(provider),
    identity: null,
    actor: null,
    permissions: [],
    journeyScope: EMPTY_SCOPE,
  };
}
