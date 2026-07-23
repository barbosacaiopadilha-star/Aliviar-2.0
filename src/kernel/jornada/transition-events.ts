import type { OperationalStage } from "./operational-stage";

export type JourneyTransitionEventType =
  | "JOURNEY_CREATED"
  | "STAGE_ADVANCED"
  | "STAGE_BLOCKED"
  | "STAGE_RESUMED"
  | "JOURNEY_CLOSED";

export interface JourneyTransitionEvent {
  id: string;
  journeyId: string;
  type: JourneyTransitionEventType;
  fromStage: OperationalStage | null;
  toStage: OperationalStage | null;
  actorId: string;
  occurredAt: string;
  metadata?: Record<string, string>;
}
