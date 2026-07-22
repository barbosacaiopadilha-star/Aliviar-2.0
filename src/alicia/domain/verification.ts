export type VerificationStatus = "verified" | "pending" | "unverified" | "disputed";

export type ConfidenceLevel = "high" | "medium" | "low";

export type Verification = {
  id: string;
  origin: string;
  recordedAt: string;
  status: VerificationStatus;
  lastVerifiedAt: string | null;
  confidence: ConfidenceLevel;
};
