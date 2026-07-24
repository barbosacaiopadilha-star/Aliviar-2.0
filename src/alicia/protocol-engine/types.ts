/** Nível de confiança da fonte — Protocolo AliCIA 1.0, Capítulo 6. */
export type SourceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CrmStatus = "active" | "suspended" | "cancelled" | "deceased" | "unknown";

export type EvidenceField =
  | "identity"
  | "crm"
  | "crm_status"
  | "rqe"
  | "teot"
  | "specialty"
  | "city"
  | "graduation"
  | "residency"
  | "fellowship"
  | "current_practice"
  | "practice_areas"
  | "trajectory_milestone";

export type Evidence = {
  id: string;
  name: string;
  type: string;
  level: SourceLevel;
  url?: string;
  consultedAt: string;
  responsible: string;
  supportsFields: EvidenceField[];
};

export type DoctorCandidate = {
  id: string;
  caseId: string;
  name: string;
  crm: string;
  crmStatus: CrmStatus;
  rqe?: string;
  teot?: string;
  specialty: string;
  city: string;
  state: string;
  graduation?: { institution: string; verified: boolean };
  residency?: Array<{ institution: string; program: string; verified: boolean }>;
  currentInstitutions?: Array<{ name: string; role: string }>;
  practiceAreas?: string[];
  collectedBy: string;
  collectedAt: string;
  hasIdentityConflict: boolean;
  duplicateCrm: boolean;
};

export type FieldVerificationStatus = "confirmed" | "pending" | "conflicting" | "insufficient";

export type FieldEvidenceStatus = {
  field: EvidenceField;
  status: FieldVerificationStatus;
  sourceIds: string[];
  conflictDetails?: string;
};

export type SourceConflict = {
  field: EvidenceField;
  sourceIds: string[];
  description: string;
};

export type EvidenceReport = {
  fields: FieldEvidenceStatus[];
  conflicts: SourceConflict[];
  highestTrustLevel: SourceLevel | null;
  level1to3Count: number;
  level1to4Count: number;
  totalSources: number;
  onlyLowTrustSources: boolean;
};

export type RuleStatus = "satisfied" | "failed" | "pending";

export type RuleResult = {
  id: string;
  name: string;
  status: RuleStatus;
  protocolRef: string;
  message: string;
};

export type OperationalLevel = "A" | "B" | "C";

export type EligibilityOutcome = "eligible" | "not_eligible" | "review_required";

export type EligibilityResult = {
  outcome: EligibilityOutcome;
  nivel: OperationalLevel;
  satisfiedRules: RuleResult[];
  failedRules: RuleResult[];
  pendingRules: RuleResult[];
  justification: string;
};

export type PublicationOutcome = "AUTO_PUBLISH" | "HUMAN_REVIEW" | "REJECT";

export type PublicationDecision = {
  outcome: PublicationOutcome;
  eligibility: EligibilityResult;
  evidenceReport: EvidenceReport;
  satisfiedRules: RuleResult[];
  pendingRules: RuleResult[];
  failedRules: RuleResult[];
  suggestedNivel: OperationalLevel;
  justification: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  protocolVersion: string;
  candidateId: string;
  caseId: string;
  decision: PublicationOutcome;
  eligibility: EligibilityOutcome;
  suggestedNivel: OperationalLevel;
  rulesExecuted: RuleResult[];
  evidenceIds: string[];
};

export type ReviewCase = {
  candidateId: string;
  caseId: string;
  candidateName: string;
  decision: PublicationDecision;
  summary: string;
  createdAt: string;
};
