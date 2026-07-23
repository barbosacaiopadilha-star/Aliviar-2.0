import { describe, expect, it } from "vitest";

import { AuthorizationService } from "./authorization-service";
import type { PlatformContext } from "../model/context";
import { authenticatedSession } from "../model/session";
import { createPatientUser, createStaffUser } from "../model/user";
import { permissionsForRole } from "../model/permission";
import { actorFromIdentity } from "../model/actor";

function buildContext(identity: NonNullable<PlatformContext["identity"]>, scope: PlatformContext["journeyScope"]): PlatformContext {
  const user =
    identity.role === "PATIENT"
      ? createPatientUser(identity.userId, "p@aliviar.health")
      : createStaffUser(identity.userId, "s@aliviar.health");

  return {
    session: authenticatedSession(user, null, "supabase"),
    identity,
    actor: actorFromIdentity(identity),
    permissions: permissionsForRole(identity.role),
    journeyScope: scope,
  };
}

describe("AuthorizationService (I03)", () => {
  it("rejeita requisi├º├úo sem sess├úo", () => {
    const auth = new AuthorizationService({
      session: { status: "unauthenticated", user: null, expiresAt: null, provider: "supabase" },
      identity: null,
      actor: null,
      permissions: [],
      journeyScope: { type: "none" },
    });

    const result = auth.authorize("journey.read");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("UNAUTHENTICATED");
    }
  });

  it("PATIENT acessa pr├│pria jornada e n├úo a de outro", () => {
    const identity = {
      userId: "auth-p1",
      role: "PATIENT" as const,
      isActive: true,
      patientId: "patient-1",
    };
    const auth = new AuthorizationService(
      buildContext(identity, { type: "own", patientId: "patient-1" }),
    );

    const own = auth.canAccessJourney({ id: "j-1", patientId: "patient-1" });
    const other = auth.canAccessJourney({ id: "j-2", patientId: "patient-2" });

    expect(own.ok).toBe(true);
    expect(other.ok).toBe(false);
  });

  it("AUDITOR l├¬ mas n├úo muta", () => {
    const identity = {
      userId: "aud-1",
      role: "AUDITOR" as const,
      isActive: true,
      staffProfileId: "aud-1",
    };
    const auth = new AuthorizationService(
      buildContext(identity, { type: "read_only_global" }),
    );

    const read = auth.canAccessJourney({ id: "j-1", patientId: "p-1" });
    const mutate = auth.canMutateJourney({ id: "j-1", patientId: "p-1" });

    expect(read.ok).toBe(true);
    expect(mutate.ok).toBe(false);
  });

  it("CURATOR n├úo possui admin.manage", () => {
    const identity = {
      userId: "cur-1",
      role: "CURATOR" as const,
      isActive: true,
      staffProfileId: "cur-1",
    };
    const auth = new AuthorizationService(
      buildContext(identity, { type: "assigned", journeyIds: [], curatorId: "cur-1" }),
    );

    expect(auth.authorize("delivery.publish").ok).toBe(true);
    expect(auth.authorize("admin.manage").ok).toBe(false);
  });
});
