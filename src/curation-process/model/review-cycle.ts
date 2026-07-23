export interface ReviewCycle {
  id: string;
  cycleNumber: number;
  summary: string;
  submittedAt: string;
  submittedBy: string;
}

export interface SubmitForFinalReviewInput {
  summary: string;
}
