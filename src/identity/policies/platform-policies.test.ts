import { describe, expect, it } from "vitest";

import { AuthorizationService } from "../authorization/authorization-service";
import { actorFromIdentity } from "../model/actor";
import { permissionsForRole } from "../model/permission";
import { authenticatedSession } from "../model/session";
import { createPatientUser, createStaffUser } from "../model/user";
import {
  CanAdvanceStage,
  CanAssignCurator,
  CanPublishDelivery,
  CanReadDocuments,
  CanReadJourney,
  evaluatePolicy,
} from "./platform-policies";

function authFor(role: "PATIENT" | "CURATOR" | "OPERATION" | "ADMIN" | "AUDITOR", extras: Record<string, string> = {}) {
  const identity = {
    userId: extras.userId ?? `${role.toLowerCase()}-1`,
    role,
    isActive: true,
    patientId: extras.patientId,
    staffProfileId: extras.staffProfileId ?? `${role.toLowerCase()}-1`,
    teamId: extras.teamId,
  };

  const user =
    role === "PATIENT"
      ? createPatientUser(identity.userId, "p@test.com")
      : createStaffUser(identity.userId, "s@test.com");

  const scope =
    role === "PATIENT"
      ? { type: "own" as const, patientId: extras.patientId ?? "p-1" }
      : role === "CURATOR"
        ? { type: "assigned" as const, journeyIds: ["j-1"], curatorId: identity.staffProfileId! }
        : role === "OPERATION"
          ? { type: "operational_queue" as const }
          : role === "AUDITOR"
            ? { type: "read_only_global" as const }
            : { type: "global" as const };

  return new AuthorizationService({
    session: authenticatedSession(user, null, "supabase"),
    identity,
    actor: actorFromIdentity(identity),
    permissions: permissionsForRole(role),
    journeyScope: scope,
  });
}

const JOURNEY = { id: "j-1", patientId: "p-1", assignedCuratorId: "curator-1" };

describe("platform policies (I05)", () => {
  it("CanReadJourney ÔÇö paciente l├¬ pr├│pria jornada", () => {
    const result = evaluatePolicy(
      authFor("PATIENT", { patientId: "p-1" }),
      CanReadJourney,
      { journey: JOURNEY },
    );
    expect(result.allowed).toBe(true);
  });

  it("CanAdvanceStage ÔÇö curador n├úo avan├ºa CADASTRO", () => {
    const result = evaluatePolicy(authFor("CURATOR"), CanAdvanceStage, {
      journey: JOURNEY,
      currentStage: "CADASTRO",
    });
    expect(result.allowed).toBe(false);
  });

  it("CanPublishDelivery ÔÇö curador publica", () => {
    const result = evaluatePolicy(authFor("CURATOR"), CanPublishDelivery, { journey: JOURNEY });
    expect(result.allowed).toBe(true);
  });

  it("CanPublishDelivery ÔÇö opera├º├úo n├úo publica", () => {
    const result = evaluatePolicy(authFor("OPERATION"), CanPublishDelivery, { journey: JOURNEY });
    expect(result.allowed).toBe(false);
  });

  it("CanAssignCurator ÔÇö opera├º├úo atribui", () => {
    const result = evaluatePolicy(authFor("OPERATION"), CanAssignCurator, { journey: JOURNEY });
    expect(result.allowed).toBe(true);
  });

  it("CanReadDocuments ÔÇö auditor l├¬ documentos", () => {
    const result = evaluatePolicy(authFor("AUDITOR"), CanReadDocuments, { journey: JOURNEY });
    expect(result.allowed).toBe(true);
  });
});
