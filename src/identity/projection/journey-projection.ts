import type { Identity } from "../model/identity";
import type { JourneyScope, JourneyRecord } from "../projection/journey-scope";
import type { PlatformRole } from "../model/permission";

/** Projeta escopo de jornadas conforme papel operacional. */
export function projectJourneyScope(
  identity: Identity,
  catalog: {
    allJourneys?: JourneyRecord[];
    assignedJourneyIds?: string[];
    teamJourneyIds?: string[];
  } = {},
): JourneyScope {
  const journeys = catalog.allJourneys ?? [];

  switch (identity.role) {
    case "PATIENT":
      return identity.patientId
        ? { type: "own", patientId: identity.patientId }
        : { type: "none" };

    case "CURATOR":
      return {
        type: "assigned",
        journeyIds: catalog.assignedJourneyIds ?? [],
        curatorId: identity.staffProfileId ?? identity.userId,
      };

    case "MANAGER":
      return {
        type: "team",
        journeyIds: catalog.teamJourneyIds ?? journeys.map((j) => j.id),
        teamId: identity.teamId ?? identity.staffProfileId ?? identity.userId,
      };

    case "OPERATION":
      return { type: "operational_queue" };

    case "ADMIN":
      return { type: "global" };

    case "AUDITOR":
      return { type: "read_only_global" };

    default:
      return { type: "none" };
  }
}

export function projectJourneyScopeForRole(
  role: PlatformRole,
  options: {
    patientId?: string;
    staffProfileId?: string;
    teamId?: string;
    userId?: string;
    catalog?: {
      allJourneys?: JourneyRecord[];
      assignedJourneyIds?: string[];
      teamJourneyIds?: string[];
    };
  },
): JourneyScope {
  return projectJourneyScope(
    {
      userId: options.userId ?? options.staffProfileId ?? "unknown",
      role,
      isActive: true,
      patientId: options.patientId,
      staffProfileId: options.staffProfileId,
      teamId: options.teamId,
    },
    options.catalog,
  );
}
