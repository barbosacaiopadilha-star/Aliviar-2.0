export interface ReportReadingCandidateView {
  id: string;
  identification: string;
  specialty: string;
  justification: string;
  reasons: Array<{ criterion: string; rationale: string }>;
  priority: number;
}

export interface ReportReadingView {
  journeyId: string;
  patientName: string;
  journeyState: string;
  sharedContextSummary: string;
  memoryHighlights: string[];
  criteriaUsed: string[];
  candidates: ReportReadingCandidateView[];
  deliveryId: string;
  publishedAt: string | null;
  firstViewedAt: string | null;
  readConfirmedAt: string | null;
  canConfirmReading: boolean;
  journeyClosed: boolean;
  portalHref: string;
}
