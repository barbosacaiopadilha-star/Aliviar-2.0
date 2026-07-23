import type { ReportStatus } from "@/curation-report";
import type { CuradoriaContextoView } from "@/vertical-slice";

export interface CuratorWorkspaceEvidenceView {
  id: string;
  origin: string;
  description: string;
  type: string;
  confidence: number;
  reference: string;
}

export interface CuratorWorkspaceCandidateView {
  id: string;
  identification: string;
  specialty: string;
  justification: string;
  priority: number;
  relatedEvidenceIds: string[];
  selectionReasons: Array<{ criterion: string; rationale: string }>;
}

export interface CuratorWorkspaceNoteView {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
}

/** Ambiente operacional do curador sobre um CurationReport — não é dashboard. */
export interface CuratorWorkspaceView {
  reportId: string;
  journeyId: string;
  caseId: string;
  patientId: string;
  patientName: string;
  caseTitle: string;
  journeyState: string;
  reportStatus: ReportStatus;
  statusLabel: string;
  editable: boolean;
  sharedContextSummary: string;
  criteriaUsed: string[];
  currentVersion: number;
  context: CuradoriaContextoView;
  evidences: CuratorWorkspaceEvidenceView[];
  medicalCandidates: CuratorWorkspaceCandidateView[];
  curatorNotes: CuratorWorkspaceNoteView[];
}
