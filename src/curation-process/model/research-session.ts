export interface ResearchFinding {
  id: string;
  description: string;
  source: string;
  recordedAt: string;
}

export interface ResearchSession {
  id: string;
  processId: string;
  topic: string;
  findings: ResearchFinding[];
  conductedAt: string;
  conductedBy: string;
}

export interface RegisterResearchFindingInput {
  topic: string;
  description: string;
  source: string;
}
