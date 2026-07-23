export interface SelectionReason {
  id: string;
  criterion: string;
  rationale: string;
}

export interface AddSelectionReasonInput {
  criterion: string;
  rationale: string;
}
