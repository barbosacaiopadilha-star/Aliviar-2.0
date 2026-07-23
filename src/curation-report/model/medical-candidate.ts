import type { SelectionReason, AddSelectionReasonInput } from "./selection-reason";

export interface MedicalCandidate {
  id: string;
  identification: string;
  specialty: string;
  justification: string;
  relatedEvidenceIds: string[];
  priority: number;
  selectionReasons: SelectionReason[];
  addedAt: string;
  addedBy: string;
}

export interface AddMedicalCandidateInput {
  identification: string;
  specialty: string;
  justification: string;
  relatedEvidenceIds: string[];
  priority: number;
  selectionReasons: AddSelectionReasonInput[];
}
