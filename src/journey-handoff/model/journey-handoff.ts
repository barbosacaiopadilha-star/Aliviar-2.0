import type { JourneyBootstrapResult } from "./bootstrap-result";
import type { HandoffStatus } from "./handoff-status";
import type { PublicChapter } from "./public-chapter";
import type { VisitorIntention } from "./visitor-intention";

export interface NarrativeCheckpoint {
  publicChapter: PublicChapter;
  capturedAt: string;
}

/** Objeto que representa a transição Experiência Pública → Caso Operacional. */
export interface JourneyHandoff {
  id: string;
  sessionId: string;
  intention: VisitorIntention;
  status: HandoffStatus;
  checkpoint: NarrativeCheckpoint;
  startedAt: string;
  completedAt: string | null;
  bootstrap: JourneyBootstrapResult | null;
}

export interface StartHandoffInput {
  sessionId: string;
  intention: VisitorIntention;
  publicChapter: PublicChapter;
}

export interface AdvanceCheckpointInput {
  handoffId: string;
  publicChapter: PublicChapter;
}
