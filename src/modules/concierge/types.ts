import type { ProtocolId } from "@/modules/ace/core/protocol-id";
import type { ProviderChange, ReviewAction, ReviewStatus } from "@/modules/ace/artifacts/human-review-result";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { CaseStatus } from "@/modules/cases/types";

// Tipos do módulo concierge (ÉPICO 1/SPRINT 3) — orquestração mínima do
// pipeline ACE (P001-P008) sobre um Caso. Nunca modela P009/P010 — isso é
// escopo de uma sprint futura (docs/PRODUCT_ARCHITECTURE.md, seção 8/9: o
// "módulo concierge" já era previsto para esta função exata).

export const ACE_EXECUTION_STATUSES = [
  "PENDING",
  "RUNNING",
  "BLOCKED",
  "FAILED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AceExecutionStatus = (typeof ACE_EXECUTION_STATUSES)[number];

export const ACE_EXECUTION_STATUS_LABELS: Record<AceExecutionStatus, string> = {
  PENDING: "Pendente",
  RUNNING: "Em execução",
  BLOCKED: "Bloqueada",
  FAILED: "Falhou",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export type AceExecution = {
  id: string;
  caseId: string;
  startedBy: string;
  startedByName: string;
  startedAt: string;
  finishedAt: string | null;
  status: AceExecutionStatus;
  currentProtocol: ProtocolId | null;
  methodVersion: string;
  failureCode: string | null;
  failureMessage: string | null;
  retryOf: string | null;
};

export const ACE_ARTIFACT_TYPES = [
  "Narrative",
  "DecisionCase",
  "CaseAudit",
  "DecisionContext",
  "CompetencyProfile",
  "EligibleProviderSet",
  "CompatibilityMatrix",
  "Shortlist",
] as const;

export type AceArtifactType = (typeof ACE_ARTIFACT_TYPES)[number];

export type AceArtifactValidationStatus = "valid" | "blocked";

export type AceArtifactSummary = {
  id: string;
  caseId: string;
  executionId: string;
  artifactType: AceArtifactType;
  version: number;
  protocolId: ProtocolId;
  protocolVersion: string;
  methodVersion: string;
  createdBy: string;
  createdAt: string;
  supersedes: string | null;
  validationStatus: AceArtifactValidationStatus;
};

// payload tipado como unknown de propósito — cada artefato do ACE já tem
// seu próprio tipo forte (Narrative, DecisionCase, ...) no módulo ace; quem
// consome um AceArtifact específico faz o cast pontual, esta camada de
// persistência genérica nunca deveria conhecer os 8 tipos concretos.
export type AceArtifact = AceArtifactSummary & {
  payload: unknown;
};

export type ConciergeActionResult = { success: true } | { success: false; error: string };

// Sprint de Observabilidade — log estruturado e append-only de uma
// execução, complementar a AceExecution (que só guarda o estado atual) e a
// AceArtifact (que guarda os resultados). Cada linha é um passo cronológico.
export const ACE_EXECUTION_EVENT_TYPES = [
  "STARTED",
  "RESUMED",
  "PROTOCOL_STARTED",
  "PROTOCOL_COMPLETED",
  "ARTIFACT_REUSED",
  "BLOCKED",
  "FAILED",
  "COMPLETED",
] as const;

export type AceExecutionEventType = (typeof ACE_EXECUTION_EVENT_TYPES)[number];

export const ACE_EXECUTION_EVENT_LABELS: Record<AceExecutionEventType, string> = {
  STARTED: "Execução iniciada",
  RESUMED: "Execução retomada",
  PROTOCOL_STARTED: "Protocolo iniciado",
  PROTOCOL_COMPLETED: "Protocolo concluído",
  ARTIFACT_REUSED: "Artefato reaproveitado",
  BLOCKED: "Execução bloqueada",
  FAILED: "Execução falhou",
  COMPLETED: "Execução concluída",
};

export type AceExecutionEvent = {
  id: string;
  executionId: string;
  caseId: string;
  eventType: AceExecutionEventType;
  protocolId: ProtocolId | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// Uma execução com o contexto de Caso/paciente já resolvido — usada pelo
// dashboard operacional (cross-caso), nunca pelas telas de um único Caso
// (que já têm esse contexto por outra via).
export type AceExecutionOverview = AceExecution & {
  patientName: string;
  caseStatus: CaseStatus;
};

export type AceHealthCheck = {
  languageModelProvider: string;
  eligibleProfessionalsCount: number;
  professionalsMissingCompetencyDataCount: number;
  stuckRunningExecutions: AceExecutionOverview[];
};

export type AceExecutionMetrics = {
  totalExecutions: number;
  byStatus: Record<AceExecutionStatus, number>;
  averageCompletionMinutes: number | null;
  blockedReasonCounts: Record<string, number>;
  failureCodeCounts: Record<string, number>;
};

// FASE BETA / SPRINT P009 — HUMAN REVIEW: primeira decisão humana real do
// produto. Modelado como registro dedicado (não um AceArtifact genérico)
// porque o próprio HumanReviewResult é estruturalmente diferente de um
// artefato de análise (ver docs/ace/artifacts/human-review-result.ts) — e
// porque um Caso pode acumular várias decisões ao longo do tempo, cada
// uma sua própria versão 1, nunca uma edição da anterior.
export type HumanReviewResultRecord = {
  id: string;
  caseId: string;
  executionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedAt: string;
  reviewStatus: ReviewStatus;
  reviewAction: ReviewAction;
  originalShortlistArtifactId: string;
  originalShortlistArtifactVersion: number;
  compatibilityMatrixArtifactId: string;
  compatibilityMatrixArtifactVersion: number;
  approvedProviderIds: string[];
  changes: ProviderChange[];
  reviewRationale: string;
  evidenceReferences: string[];
  returnToProtocol: ProtocolId | null;
  methodVersion: string;
  version: number;
  createdAt: string;
};

// ÚLTIMA SPRINT DO MVP — ENTREGA DA CURADORIA (P010): a única linha desta
// sessão que a RLS libera para o próprio paciente ler — todo campo aqui já
// foi desenhado para ele, nunca contém protocolo, artefato interno, score
// ou prompt.
export type FinalCuradoriaDeliveryRecord = {
  id: string;
  caseId: string;
  patientProfileId: string;
  humanReviewResultId: string;
  validatedBy: string;
  validatedByName: string;
  validatedAt: string;
  deliveredBy: string;
  deliveredByName: string;
  deliveredAt: string;
  generatedAt: string;
  decisionSummary: string;
  clientContextSummary: string;
  providerPresentations: ProviderPresentation[];
  comparisonSummary: string;
  relevantLimitations: string[];
  relevantMissingInformation: string[];
  nextSteps: string[];
  methodExplanation: string;
  disclaimer: string;
  methodVersion: string;
  version: number;
  createdAt: string;
};
