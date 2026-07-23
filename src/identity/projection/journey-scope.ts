/** Proje├º├úo de visibilidade de jornadas por papel. */
export type JourneyScope =
  | { type: "none" }
  | { type: "own"; patientId: string }
  | { type: "assigned"; journeyIds: readonly string[]; curatorId: string }
  | { type: "team"; journeyIds: readonly string[]; teamId: string }
  | { type: "operational_queue" }
  | { type: "global" }
  | { type: "read_only_global" };

export interface JourneyRecord {
  id: string;
  patientId: string;
  assignedCuratorId?: string | null;
  teamId?: string | null;
}

export function journeyVisibleInScope(scope: JourneyScope, journey: JourneyRecord): boolean {
  switch (scope.type) {
    case "none":
      return false;
    case "own":
      return journey.patientId === scope.patientId;
    case "assigned":
      return (
        scope.journeyIds.includes(journey.id) ||
        journey.assignedCuratorId === scope.curatorId
      );
    case "team":
      return scope.journeyIds.includes(journey.id) || journey.teamId === scope.teamId;
    case "operational_queue":
    case "global":
    case "read_only_global":
      return true;
    default:
      return false;
  }
}

export function scopeAllowsWrite(scope: JourneyScope): boolean {
  return scope.type !== "read_only_global" && scope.type !== "none";
}
