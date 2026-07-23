/** Respons├ível interno pela jornada nascida do caso. */
export interface JourneyOwnership {
  managerId: string;
  operationId?: string | null;
  curatorId?: string | null;
}

export function createJourneyOwnership(managerId: string, extras?: {
  operationId?: string | null;
  curatorId?: string | null;
}): JourneyOwnership {
  return {
    managerId,
    operationId: extras?.operationId ?? null,
    curatorId: extras?.curatorId ?? null,
  };
}

export function primaryOwnerId(ownership: JourneyOwnership): string {
  return ownership.managerId;
}
