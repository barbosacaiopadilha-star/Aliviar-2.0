export interface Investigation {
  id: string;
  summary: string;
  scope: string;
  startedAt: string;
  startedBy: string;
}

export interface StartInvestigationInput {
  summary: string;
  scope: string;
}
