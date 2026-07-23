import type { Identity } from "../model/identity";
import { actorFromIdentity } from "../model/actor";
import { permissionsForRole } from "../model/permission";
import type { Session, SessionProvider } from "../model/session";
import { authenticatedSession, invalidSession, unauthenticatedSession } from "../model/session";
import { createPatientUser, createStaffUser } from "../model/user";
import type { AuthProviderPort } from "../ports/auth-provider-port";
import type { JourneyScopePort } from "../ports/journey-scope-port";
import { projectJourneyScope } from "../projection/journey-projection";
import type { JourneyRecord } from "../projection/journey-scope";

export interface InMemoryAuthUser {
  id: string;
  email: string | null;
  identity: Identity;
}

export class InMemoryAuthProvider implements AuthProviderPort {
  readonly provider: SessionProvider;

  private currentUserId: string | null = null;
  private readonly users = new Map<string, InMemoryAuthUser>();

  constructor(provider: SessionProvider = "supabase") {
    this.provider = provider;
  }

  register(user: InMemoryAuthUser): void {
    this.users.set(user.id, user);
  }

  signIn(userId: string): void {
    this.currentUserId = userId;
  }

  signOut(): void {
    this.currentUserId = null;
  }

  async resolveSession(): Promise<Session> {
    if (!this.currentUserId) {
      return unauthenticatedSession(this.provider);
    }

    const user = this.users.get(this.currentUserId);
    if (!user) {
      return invalidSession(this.provider);
    }

    const kind = user.identity.role === "PATIENT" ? "patient" : "staff";
    const platformUser =
      kind === "patient"
        ? createPatientUser(user.id, user.email)
        : createStaffUser(user.id, user.email);

    return authenticatedSession(
      platformUser,
      new Date(Date.now() + 3600_000).toISOString(),
      this.provider,
    );
  }

  async resolveIdentity(session: Session): Promise<Identity | null> {
    if (session.status !== "authenticated" || !session.user) {
      return null;
    }

    const user = this.users.get(session.user.id);
    return user?.identity ?? null;
  }
}

export class InMemoryJourneyScopePort implements JourneyScopePort {
  constructor(private readonly catalog: JourneyRecord[] = []) {}

  async resolveScope(identity: Identity) {
    const assigned = this.catalog
      .filter((j) => j.assignedCuratorId === (identity.staffProfileId ?? identity.userId))
      .map((j) => j.id);

    const team = this.catalog
      .filter((j) => j.teamId === identity.teamId)
      .map((j) => j.id);

    return projectJourneyScope(identity, {
      allJourneys: this.catalog,
      assignedJourneyIds: assigned,
      teamJourneyIds: team,
    });
  }
}

export class InMemoryMagicLinkAuthProvider extends InMemoryAuthProvider {
  constructor() {
    super("magic_link");
  }

  async sendMagicLink(email: string): Promise<{ ok: boolean }> {
    void email;
    return { ok: true };
  }
}

export class InMemoryJwtAuthProvider extends InMemoryAuthProvider {
  constructor() {
    super("jwt");
  }

  async verifyToken(token: string): Promise<Session> {
    this.signIn(token);
    return this.resolveSession();
  }
}

export function buildTestContextFromIdentity(
  identity: Identity,
  catalog: JourneyRecord[] = [],
) {
  const auth = new InMemoryAuthProvider();
  auth.register({
    id: identity.userId,
    email: "test@aliviar.health",
    identity,
  });
  auth.signIn(identity.userId);

  return {
    auth,
    scopePort: new InMemoryJourneyScopePort(catalog),
    actor: actorFromIdentity(identity),
    permissions: permissionsForRole(identity.role),
  };
}
