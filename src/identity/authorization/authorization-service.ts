import type { PlatformContext } from "../model/context";
import { hasIdentity } from "../model/context";
import type { PlatformPermission } from "../model/permission";
import { platformRoleHasPermission } from "../model/permission";
import type { JourneyRecord, JourneyScope } from "../projection/journey-scope";
import { journeyVisibleInScope, scopeAllowsWrite } from "../projection/journey-scope";

export type AuthorizationFailureReason =
  | "UNAUTHENTICATED"
  | "INACTIVE_IDENTITY"
  | "FORBIDDEN"
  | "SCOPE_DENIED"
  | "OWNERSHIP_REQUIRED";

export interface AuthorizationSuccess {
  ok: true;
  context: PlatformContext & { identity: NonNullable<PlatformContext["identity"]>; actor: NonNullable<PlatformContext["actor"]> };
}

export interface AuthorizationFailure {
  ok: false;
  reason: AuthorizationFailureReason;
  message: string;
}

export type AuthorizationResult = AuthorizationSuccess | AuthorizationFailure;

/**
 * Servi├ºo centralizado de autoriza├º├úo.
 * Toda verifica├º├úo de permiss├úo na plataforma deve passar por aqui.
 */
export class AuthorizationService {
  constructor(private readonly context: PlatformContext) {}

  getContext(): PlatformContext {
    return this.context;
  }

  requireAuthenticated(): AuthorizationResult {
    if (this.context.session.status === "unauthenticated") {
      return {
        ok: false,
        reason: "UNAUTHENTICATED",
        message: "Sess├úo ausente.",
      };
    }

    if (this.context.session.status === "invalid") {
      return {
        ok: false,
        reason: "UNAUTHENTICATED",
        message: "Sess├úo inv├ílida.",
      };
    }

    if (!hasIdentity(this.context)) {
      return {
        ok: false,
        reason: this.context.identity && !this.context.identity.isActive
          ? "INACTIVE_IDENTITY"
          : "UNAUTHENTICATED",
        message: "Identidade ativa obrigat├│ria.",
      };
    }

    return {
      ok: true,
      context: this.context as AuthorizationSuccess["context"],
    };
  }

  authorize(permission: PlatformPermission): AuthorizationResult {
    const auth = this.requireAuthenticated();
    if (!auth.ok) {
      return auth;
    }

    if (!platformRoleHasPermission(auth.context.actor.role, permission)) {
      return {
        ok: false,
        reason: "FORBIDDEN",
        message: `Papel ${auth.context.actor.role} n├úo possui permiss├úo ${permission}.`,
      };
    }

    return auth;
  }

  canAccessJourney(journey: JourneyRecord): AuthorizationResult {
    const auth = this.authorize("journey.read");
    if (!auth.ok) {
      return auth;
    }

    if (!journeyVisibleInScope(this.context.journeyScope, journey)) {
      return {
        ok: false,
        reason: "SCOPE_DENIED",
        message: "Jornada fora do escopo deste ator.",
      };
    }

    if (
      auth.context.actor.role === "PATIENT" &&
      journey.patientId !== auth.context.actor.patientId
    ) {
      return {
        ok: false,
        reason: "OWNERSHIP_REQUIRED",
        message: "Paciente s├│ pode acessar a pr├│pria jornada.",
      };
    }

    return auth;
  }

  canMutateJourney(journey: JourneyRecord): AuthorizationResult {
    const read = this.canAccessJourney(journey);
    if (!read.ok) {
      return read;
    }

    if (!scopeAllowsWrite(this.context.journeyScope)) {
      return {
        ok: false,
        reason: "FORBIDDEN",
        message: "Escopo somente leitura.",
      };
    }

    return read;
  }

  journeyScope(): JourneyScope {
    return this.context.journeyScope;
  }
}
