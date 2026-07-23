export const EVIDENCE_TYPES = [
  "CLINICAL",
  "DOCUMENTARY",
  "OBSERVATION",
  "REFERENCE",
  "OTHER",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export interface Evidence {
  id: string;
  origin: string;
  description: string;
  type: EvidenceType;
  confidence: number;
  reference: string;
  addedAt: string;
  addedBy: string;
}

export interface AddEvidenceInput {
  origin: string;
  description: string;
  type: EvidenceType;
  confidence: number;
  reference: string;
}
