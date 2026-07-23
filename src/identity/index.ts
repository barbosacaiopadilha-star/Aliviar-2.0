// Model ÔÇö I01
export type { User, UserKind } from "./model/user";
export { createAnonymousUser, createStaffUser, createPatientUser } from "./model/user";

export type { Session, SessionProvider, SessionStatus } from "./model/session";
export {
  authenticatedSession,
  invalidSession,
  unauthenticatedSession,
  isAuthenticated,
} from "./model/session";

export type { Identity } from "./model/identity";
export { isPatientIdentity, isStaffIdentity } from "./model/identity";

export type { Actor } from "./model/actor";
export { actorFromIdentity, toKernelActor } from "./model/actor";

export type { PlatformPermission, PlatformRole } from "./model/permission";
export {
  PLATFORM_ROLES,
  PLATFORM_PERMISSION_MATRIX,
  platformRoleHasPermission,
  permissionsForRole,
} from "./model/permission";

export type { PlatformContext } from "./model/context";
export { hasIdentity } from "./model/context";

// Session ÔÇö I02
export {
  resolveSessionContext,
  createAuthorizationService,
  emptyPlatformContext,
} from "./session/resolve-session-context";
export type { ResolveSessionContextDeps } from "./session/resolve-session-context";

// Authorization ÔÇö I03
export { AuthorizationService } from "./authorization/authorization-service";
export type {
  AuthorizationResult,
  AuthorizationFailure,
  AuthorizationSuccess,
  AuthorizationFailureReason,
} from "./authorization/authorization-service";

// Projection ÔÇö I04
export type { JourneyScope, JourneyRecord } from "./projection/journey-scope";
export { journeyVisibleInScope, scopeAllowsWrite } from "./projection/journey-scope";
export { projectJourneyScope, projectJourneyScopeForRole } from "./projection/journey-projection";

// Policies ÔÇö I05
export {
  CanAdvanceStage,
  CanReadJourney,
  CanPublishDelivery,
  CanAssignCurator,
  CanReadDocuments,
  PLATFORM_POLICIES,
  evaluatePolicy,
} from "./policies/platform-policies";
export type { Policy, PolicyResult } from "./policies/platform-policies";

// Ports ÔÇö I06
export type {
  AuthProviderPort,
  SupabaseAuthPort,
  MagicLinkAuthPort,
  JwtAuthPort,
} from "./ports/auth-provider-port";
export type { JourneyScopePort } from "./ports/journey-scope-port";

// Infrastructure (test adapters)
export {
  InMemoryAuthProvider,
  InMemoryJourneyScopePort,
  InMemoryMagicLinkAuthProvider,
  InMemoryJwtAuthProvider,
  buildTestContextFromIdentity,
} from "./infrastructure/in-memory-auth-provider";
