export interface CandidateReview {
  id: string;
  candidateId: string;
  assessment: string;
  notes: string;
  reviewedAt: string;
  reviewedBy: string;
}

export interface AddCandidateReviewInput {
  candidateId: string;
  assessment: string;
  notes: string;
}
