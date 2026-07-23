import type { Identity } from "@/identity/model/identity";
import type { Session, SessionProvider } from "@/identity/model/session";
import { authenticatedSession } from "@/identity/model/session";
import { createPatientUser, createStaffUser } from "@/identity/model/user";
import type { AuthProviderPort } from "@/identity/ports/auth-provider-port";
import type { JourneyScopePort } from "@/identity/ports/journey-scope-port";
import { projectJourneyScope } from "@/identity/projection/journey-projection";
import type { JourneyRecord } from "@/identity/projection/journey-scope";

export class SessionIdentityAuthProvider implements AuthProviderPort {
  readonly provider: SessionProvider = "supabase";

  constructor(
    private readonly identity: Identity,
    private readonly email: string | null,
  ) {}

  async resolveSession(): Promise<Session> {
    const kind = this.identity.role === "PATIENT" ? "patient" : "staff";
    const platformUser =
      kind === "patient"
        ? createPatientUser(this.identity.userId, this.email)
        : createStaffUser(this.identity.userId, this.email);

    return authenticatedSession(
      platformUser,
      new Date(Date.now() + 3600_000).toISOString(),
      this.provider,
    );
  }

  async resolveIdentity(session: Session): Promise<Identity | null> {
    if (session.status !== "authenticated") {
      return null;
    }
    return this.identity;
  }
}

export class StaticJourneyScopePort implements JourneyScopePort {
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
