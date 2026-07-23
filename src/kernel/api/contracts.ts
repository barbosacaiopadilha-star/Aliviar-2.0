import type { OperationalStage } from "../jornada/operational-stage";
import type { KernelRole } from "../rbac/permissions";

export interface KernelJourneyView {
  id: string;
  patientId: string;
  currentStage: OperationalStage;
  completedStages: OperationalStage[];
  isBlocked: boolean;
  blockReason: string | null;
  isClosed: boolean;
  closedAt: string | null;
  version: number;
  updatedAt: string;
}

export interface CreateJourneyRequest {
  journeyId: string;
  patientId: string;
}

export interface CreateJourneyResponse {
  journey: KernelJourneyView;
}

export interface AdvanceJourneyRequest {
  journeyId: string;
}

export interface AdvanceJourneyResponse {
  journey: KernelJourneyView;
  fromStage: OperationalStage;
  toStage: OperationalStage;
}

export interface RegisterJourneyEventRequest {
  journeyId: string;
  category: string;
  title: string;
  description?: string | null;
  journeyImpact?: string | null;
  nextStep?: string | null;
  occurredAt: string;
}

export interface RegisterJourneyEventResponse {
  eventId: string;
}

export interface CreateCommitmentRequest {
  journeyId: string;
  title: string;
  assignedTo: string;
  dueDate?: string | null;
}

export interface CreateCommitmentResponse {
  commitmentId: string;
}

export interface CompleteCommitmentRequest {
  journeyId: string;
  commitmentId: string;
}

export interface CompleteCommitmentResponse {
  commitmentId: string;
  status: "COMPLETED";
}

export interface QueryTimelineRequest {
  journeyId: string;
}

export interface QueryTimelineResponse {
  events: Array<{
    id: string;
    category: string;
    title: string;
    description: string | null;
    occurredAt: string;
    source: string;
  }>;
}

export interface KernelErrorResponse {
  code: "FORBIDDEN" | "OWNERSHIP_REQUIRED" | "DOMAIN_ERROR" | "NOT_FOUND";
  message: string;
}

export interface KernelActorContext {
  actorId: string;
  role: KernelRole;
  patientId?: string;
}

export type KernelApiResult<T> =
  | { status: 200; body: T }
  | { status: 403; body: KernelErrorResponse }
  | { status: 404; body: KernelErrorResponse }
  | { status: 422; body: KernelErrorResponse };

function toView(snapshot: {
  id: string;
  patientId: string;
  currentStage: OperationalStage;
  completedStages: OperationalStage[];
  isBlocked: boolean;
  blockReason: string | null;
  closedAt: string | null;
  version: number;
  updatedAt: string;
}): KernelJourneyView {
  return {
    id: snapshot.id,
    patientId: snapshot.patientId,
    currentStage: snapshot.currentStage,
    completedStages: snapshot.completedStages,
    isBlocked: snapshot.isBlocked,
    blockReason: snapshot.blockReason,
    isClosed: snapshot.closedAt !== null,
    closedAt: snapshot.closedAt,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
  };
}

export { toView as toKernelJourneyView };
