export type VerificationEventType =
  | "VerificationRequested"
  | "VerificationStarted"
  | "VerificationCompleted"
  | "VerificationFailed"
  | "ProfileChanged"
  | "ReviewRequested";

export type VerificationRequestedPayload = {
  profileId: string;
  candidateId: string;
  frequency: string;
  reason: string;
};

export type VerificationStartedPayload = {
  profileId: string;
  candidateId: string;
};

export type VerificationCompletedPayload = {
  profileId: string;
  candidateId: string;
  decision: string;
  classification: string;
  protocolOutcome: string;
};

export type VerificationFailedPayload = {
  profileId: string;
  candidateId: string;
  error: string;
};

export type ProfileChangedPayload = {
  profileId: string;
  candidateId: string;
  classification: string;
  changes: Array<{ field: string; previous: string; current: string }>;
};

export type ReviewRequestedPayload = {
  profileId: string;
  candidateId: string;
  reason: string;
  summary: string;
};
