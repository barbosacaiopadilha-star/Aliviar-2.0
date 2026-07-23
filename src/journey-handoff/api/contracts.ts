import type { PublicChapter } from "../model/public-chapter";
import type { VisitorIntention } from "../model/visitor-intention";
import type { PortalContinuationProjection } from "../projection/portal-continuation";
import type { JourneyHandoff } from "../model/journey-handoff";
import type { BootstrapPatientInput } from "../model/bootstrap-result";

export interface StartHandoffRequest {
  sessionId: string;
  intention: VisitorIntention;
  publicChapter: PublicChapter;
}

export interface StartHandoffResponse {
  handoff: JourneyHandoff;
}

export interface CompleteHandoffRequest {
  handoffId: string;
  publicChapter: PublicChapter;
}

export interface CompleteHandoffResponse {
  handoff: JourneyHandoff;
}

export interface BootstrapJourneyRequest {
  handoffId: string;
  intention: VisitorIntention;
  patient: BootstrapPatientInput;
  journeyTitle: string;
  journeyObjective?: string | null;
  managerId?: string | null;
}

export interface BootstrapJourneyResponse {
  handoff: JourneyHandoff;
}

export interface ProjectContinuationRequest {
  handoffId: string;
}

export interface ProjectContinuationResponse {
  continuation: PortalContinuationProjection;
}

export type HandoffApiErrorCode = "NOT_FOUND" | "DOMAIN_ERROR";

export interface HandoffApiError {
  code: HandoffApiErrorCode;
  message: string;
}

export type HandoffApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HandoffApiError };
