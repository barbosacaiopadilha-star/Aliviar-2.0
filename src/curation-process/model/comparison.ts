export interface Comparison {
  id: string;
  candidateIds: string[];
  criteria: string[];
  conclusion: string;
  comparedAt: string;
  comparedBy: string;
}

export interface CompareCandidatesInput {
  candidateIds: string[];
  criteria: string[];
  conclusion: string;
}
