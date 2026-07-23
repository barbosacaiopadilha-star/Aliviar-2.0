export type HandoffEventType =
  | "HANDOFF_STARTED"
  | "HANDOFF_COMPLETED"
  | "JOURNEY_BOOTSTRAPPED";

export interface HandoffEvent {
  type: HandoffEventType;
  handoffId: string;
  sessionId: string;
  occurredAt: string;
  payload: Record<string, string>;
}

export function handoffStartedEvent(
  handoffId: string,
  sessionId: string,
  intention: string,
  publicChapter: string,
  occurredAt: string,
): HandoffEvent {
  return {
    type: "HANDOFF_STARTED",
    handoffId,
    sessionId,
    occurredAt,
    payload: { intention, publicChapter },
  };
}

export function handoffCompletedEvent(
  handoffId: string,
  sessionId: string,
  publicChapter: string,
  occurredAt: string,
): HandoffEvent {
  return {
    type: "HANDOFF_COMPLETED",
    handoffId,
    sessionId,
    occurredAt,
    payload: { publicChapter },
  };
}

export function journeyBootstrappedEvent(
  handoffId: string,
  sessionId: string,
  journeyId: string,
  caseId: string,
  patientId: string,
  occurredAt: string,
): HandoffEvent {
  return {
    type: "JOURNEY_BOOTSTRAPPED",
    handoffId,
    sessionId,
    occurredAt,
    payload: { journeyId, caseId, patientId },
  };
}
