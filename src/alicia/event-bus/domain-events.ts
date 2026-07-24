import type { PublicationOutcome } from "@/alicia/protocol-engine";
import type { PipelineStatus } from "@/alicia/publication-pipeline";

export type DiscoveryCompletedPayload = {
  runId: string;
  candidateCount: number;
  candidateIds: string[];
  completedAt: string;
};

export type CandidateQueuedPayload = {
  candidateId: string;
  nome: string;
  especialidade: string;
  cidade: string;
  fontes: string[];
  queueStatus: string;
};

export type EvidenceRequestedPayload = {
  candidateId: string;
  correlationId: string;
};

export type EvidenceCollectedPayload = {
  candidateId: string;
  evidenceCount: number;
};

export type EvidenceFailedPayload = {
  candidateId: string;
  reason: string;
};

export type ProtocolStartedPayload = {
  candidateId: string;
};

export type ProtocolEvaluatedPayload = {
  candidateId: string;
  outcome: PublicationOutcome;
  suggestedNivel: string;
};

export type PublicationRequestedPayload = {
  candidateId: string;
  protocolDecisionId: string;
};

export type PublicationStartedPayload = {
  candidateId: string;
  snapshotId?: string;
};

export type PublicationSucceededPayload = {
  candidateId: string;
  status: PipelineStatus;
  snapshotId?: string;
};

export type PublicationFailedPayload = {
  candidateId: string;
  status: PipelineStatus;
  message?: string;
};

export type PublicationRolledBackPayload = {
  candidateId: string;
  snapshotId?: string;
  reason: string;
};

export type ReviewCaseCreatedPayload = {
  candidateId: string;
  reason: string;
  summary: string;
};

export type ReviewCaseResolvedPayload = {
  candidateId: string;
  resolution: string;
};

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

export type FactoryStartedPayload = {
  runId: string;
  schedule: string;
  dryRun: boolean;
  correlationId: string;
};

export type FactoryFinishedPayload = {
  runId: string;
  durationMs: number;
  candidatesFound: number;
  evidencePackages: number;
  published: number;
  reviewCases: number;
  dryRun: boolean;
};

export type FactoryFailedPayload = {
  runId: string;
  reason: string;
  stage?: string;
};

export type FactoryCheckpointPayload = {
  runId: string;
  stage: string;
  completedAt: string;
  candidateCount: number;
};

export type FactoryResumedPayload = {
  runId: string;
  fromStage: string;
};

export type FactoryDryRunPayload = {
  runId: string;
  wouldPublish: number;
  skippedPublication: boolean;
};
