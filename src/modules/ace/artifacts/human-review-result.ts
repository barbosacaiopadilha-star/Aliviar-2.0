// HumanReviewResult — artefato de saída do P009 (Human Review). Ver
// docs/ace/04-specs/P009-human-review/specification.md, seção "Saída".
//
// Primeiro e único artefato do ACE com autoridade decisória real
// (Constituição, Princípio 9; Kernel, seção 6): estende
// `HumanDecisionArtifact`, nunca `AnalysisArtifact`. `decisional: true` é
// estampado pela construção, assim como `reviewerId`/`reviewedAt` — mas a
// IA nunca decide: `reviewAction` é sempre a ação que um humano tomou, e
// todo o resto do artefato (approvedProviderIds, changes, rationale,
// evidenceReferences) é o registro estruturado dessa ação, nunca uma
// simulação ou substituto do julgamento humano.
//
// Ainda passa por `assertFieldPolicy` — as proibições permanentes do
// Kernel (diagnóstico, conduta médica, viés comercial) são absolutas e
// nunca dependem do tipo de artefato (Kernel, seção 6).

import type { HumanDecisionArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";

// A ação que o revisor humano efetivamente tomou — nunca escolhida ou
// simulada pelo software.
export type ReviewAction = "APPROVE" | "ADJUST" | "REJECT" | "REQUEST_MORE_INFORMATION";

// O que a ação significa para o restante do pipeline: apenas VALIDATED
// (originada por APPROVE ou por um ADJUST válido) pode originar uma
// Curadoria Validada. REJECTED e INFORMATION_REQUESTED nunca podem.
export type ReviewStatus = "VALIDATED" | "REJECTED" | "INFORMATION_REQUESTED";

export type ProviderChangeType = "added" | "removed";

export type ProviderChange = {
  type: ProviderChangeType;
  providerId: string;
  rationale: string;
  evidenceReferences: string[];
};

export type HumanReviewSourceType = "Shortlist" | "CompatibilityMatrix";

export type HumanReviewSourceReference = ArtifactReference<HumanReviewSourceType>;

export type HumanReviewResult = HumanDecisionArtifact & {
  reviewStatus: ReviewStatus;
  reviewAction: ReviewAction;
  originalShortlistReference: HumanReviewSourceReference;
  compatibilityMatrixReference: HumanReviewSourceReference;
  // Exatamente 3 quando reviewStatus === "VALIDATED"; vazio caso contrário.
  approvedProviderIds: string[];
  changes: ProviderChange[];
  reviewRationale: string;
  evidenceReferences: string[];
  // Preenchido apenas quando a resolução exige retomar um estágio anterior
  // do pipeline (ex.: considerar um provider que não está na
  // CompatibilityMatrix) — nunca quando reviewStatus é VALIDATED.
  returnToProtocol: ProtocolId | null;
  methodVersion: string;
};

export type CreateHumanReviewResultInput = {
  reviewerId: string;
  reviewedAt: string;
  reviewStatus: ReviewStatus;
  reviewAction: ReviewAction;
  originalShortlistReference: HumanReviewSourceReference;
  compatibilityMatrixReference: HumanReviewSourceReference;
  approvedProviderIds: string[];
  changes: ProviderChange[];
  reviewRationale: string;
  evidenceReferences: string[];
  returnToProtocol: ProtocolId | null;
  methodVersion: string;
};

const REQUIRED_APPROVED_SIZE = 3;

const ACTION_TO_STATUS: Record<ReviewAction, ReviewStatus[]> = {
  APPROVE: ["VALIDATED"],
  ADJUST: ["VALIDATED"],
  REJECT: ["REJECTED"],
  REQUEST_MORE_INFORMATION: ["INFORMATION_REQUESTED"],
};

function assertRequiredFields(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  if (!input.reviewerId) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "HumanReviewResult requer reviewerId — quem decidiu nunca pode ficar implícito.",
    });
  }

  if (!input.reviewedAt) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "HumanReviewResult requer reviewedAt — quando decidiu nunca pode ficar implícito.",
    });
  }

  if (!input.reviewRationale) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "HumanReviewResult requer reviewRationale, para toda ação — inclusive REJECT e REQUEST_MORE_INFORMATION.",
    });
  }

  if (!input.originalShortlistReference || !input.compatibilityMatrixReference) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "HumanReviewResult requer originalShortlistReference e compatibilityMatrixReference.",
    });
  }
}

function assertStatusMatchesAction(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  const allowedStatuses = ACTION_TO_STATUS[input.reviewAction];
  if (!allowedStatuses.includes(input.reviewStatus)) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `reviewAction "${input.reviewAction}" não pode produzir reviewStatus "${input.reviewStatus}" — esperado ${allowedStatuses.join(" ou ")}.`,
    });
  }
}

function assertApprovedProviderIdsConsistency(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  if (input.reviewStatus === "VALIDATED") {
    if (input.approvedProviderIds.length !== REQUIRED_APPROVED_SIZE) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `Um HumanReviewResult VALIDATED deve conter exatamente ${REQUIRED_APPROVED_SIZE} approvedProviderIds — recebido ${input.approvedProviderIds.length}.`,
      });
    }
    if (new Set(input.approvedProviderIds).size !== input.approvedProviderIds.length) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: "approvedProviderIds não pode conter providers duplicados.",
      });
    }
  } else if (input.approvedProviderIds.length !== 0) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `Um HumanReviewResult com reviewStatus "${input.reviewStatus}" não pode conter approvedProviderIds — nenhuma composição foi validada.`,
    });
  }
}

function assertChangesConsistency(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  if (input.reviewAction === "APPROVE" && input.changes.length !== 0) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "APPROVE aceita integralmente a Shortlist original — não deve haver changes registradas.",
    });
  }

  if (input.reviewAction === "ADJUST" && input.changes.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "ADJUST requer ao menos uma alteração registrada em changes — caso contrário, a ação correta é APPROVE.",
    });
  }

  if ((input.reviewAction === "REJECT" || input.reviewAction === "REQUEST_MORE_INFORMATION") && input.changes.length !== 0) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `${input.reviewAction} não altera a composição — changes deve estar vazio.`,
    });
  }

  for (const change of input.changes) {
    if (!change.rationale) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `A alteração sobre o provider "${change.providerId}" requer justificativa própria (rationale).`,
      });
    }
    if (!change.evidenceReferences || change.evidenceReferences.length === 0) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `A alteração sobre o provider "${change.providerId}" requer ao menos uma evidência em evidenceReferences.`,
      });
    }
  }
}

function assertReturnToProtocolConsistency(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  if (input.reviewStatus === "VALIDATED" && input.returnToProtocol !== null) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "Um HumanReviewResult VALIDATED não retorna a nenhum estágio anterior — returnToProtocol deve ser null.",
    });
  }
}

function assertEvidenceForValidatedActions(input: CreateHumanReviewResultInput, protocolId: "P009"): void {
  if (input.reviewStatus === "VALIDATED" && input.evidenceReferences.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "APPROVE e ADJUST requerem ao menos uma referência em evidenceReferences — toda validação humana cita a evidência que a fundamenta.",
    });
  }
}

export function createHumanReviewResult(input: CreateHumanReviewResultInput): HumanReviewResult {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P009", "HumanReviewResult");
  assertRequiredFields(input, "P009");
  assertStatusMatchesAction(input, "P009");
  assertApprovedProviderIdsConsistency(input, "P009");
  assertChangesConsistency(input, "P009");
  assertReturnToProtocolConsistency(input, "P009");
  assertEvidenceForValidatedActions(input, "P009");

  return createInitialVersion({
    ...input,
    decisional: true,
    producedBy: "P009",
  }) as HumanReviewResult;
}
