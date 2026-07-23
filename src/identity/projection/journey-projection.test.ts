import { describe, expect, it } from "vitest";

import { journeyVisibleInScope, scopeAllowsWrite } from "./journey-scope";
import { projectJourneyScopeForRole } from "./journey-projection";

const CATALOG = [
  { id: "j-1", patientId: "p-1", assignedCuratorId: "cur-1", teamId: "team-a" },
  { id: "j-2", patientId: "p-2", assignedCuratorId: "cur-2", teamId: "team-a" },
  { id: "j-3", patientId: "p-3", assignedCuratorId: null, teamId: "team-b" },
];

describe("journey projection (I04)", () => {
  it("PATIENT v├¬ apenas pr├│pria jornada", () => {
    const scope = projectJourneyScopeForRole("PATIENT", { patientId: "p-1" });
    expect(scope.type).toBe("own");
    expect(journeyVisibleInScope(scope, CATALOG[0]!)).toBe(true);
    expect(journeyVisibleInScope(scope, CATALOG[1]!)).toBe(false);
  });

  it("CURATOR v├¬ jornadas atribu├¡das", () => {
    const scope = projectJourneyScopeForRole("CURATOR", {
      staffProfileId: "cur-1",
      userId: "cur-1",
      catalog: { allJourneys: CATALOG, assignedJourneyIds: ["j-1"] },
    });
    expect(scope.type).toBe("assigned");
    expect(journeyVisibleInScope(scope, CATALOG[0]!)).toBe(true);
    expect(journeyVisibleInScope(scope, CATALOG[1]!)).toBe(false);
  });

  it("MANAGER v├¬ jornadas do time", () => {
    const scope = projectJourneyScopeForRole("MANAGER", {
      staffProfileId: "mgr-1",
      teamId: "team-a",
      userId: "mgr-1",
      catalog: { allJourneys: CATALOG, teamJourneyIds: ["j-1", "j-2"] },
    });
    expect(journeyVisibleInScope(scope, CATALOG[0]!)).toBe(true);
    expect(journeyVisibleInScope(scope, CATALOG[2]!)).toBe(false);
  });

  it("OPERATION v├¬ fila operacional", () => {
    const scope = projectJourneyScopeForRole("OPERATION", { userId: "op-1" });
    expect(scope.type).toBe("operational_queue");
    expect(journeyVisibleInScope(scope, CATALOG[0]!)).toBe(true);
  });

  it("ADMIN tem vis├úo global com escrita", () => {
    const scope = projectJourneyScopeForRole("ADMIN", { userId: "admin-1" });
    expect(scope.type).toBe("global");
    expect(scopeAllowsWrite(scope)).toBe(true);
  });

  it("AUDITOR tem vis├úo global somente leitura", () => {
    const scope = projectJourneyScopeForRole("AUDITOR", { userId: "aud-1" });
    expect(scope.type).toBe("read_only_global");
    expect(scopeAllowsWrite(scope)).toBe(false);
    expect(journeyVisibleInScope(scope, CATALOG[0]!)).toBe(true);
  });
});
