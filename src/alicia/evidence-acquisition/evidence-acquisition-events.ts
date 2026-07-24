export type EvidenceAcquisitionEventType =
  | "EvidencePackageCreated"
  | "EvidenceConflictDetected"
  | "EvidencePackageUpdated"
  | "EvidencePackageRejected";

export type EvidencePackageCreatedPayload = {
  packageId: string;
  candidateId: string;
  sourceCount: number;
  conflictCount: number;
  coverageAverage: number;
};

export type EvidenceConflictDetectedPayload = {
  packageId: string;
  candidateId: string;
  conflictId: string;
  conflictType: string;
  field: string;
};

export type EvidencePackageUpdatedPayload = {
  packageId: string;
  candidateId: string;
  version: number;
  conflictCount: number;
  coverageAverage: number;
};

export type EvidencePackageRejectedPayload = {
  candidateId: string;
  reason: string;
};
