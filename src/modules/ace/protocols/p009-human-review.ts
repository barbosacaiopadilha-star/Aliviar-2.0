// P009 — Human Review.
// Ver docs/ace/04-specs/P009-human-review/specification.md.
//
// Primeiro protocolo do ACE que não é inteiramente determinístico por
// natureza: a decisão em si (APPROVE/ADJUST/REJECT/REQUEST_MORE_INFORMATION)
// é sempre de um humano da equipe Aliviar, nunca simulada ou escolhida por
// este código. O que É determinístico, e o que este protocolo de fato
// executa, é a validação estrutural dessa decisão — nunca a decisão em
// si: verificar que a CompatibilityMatrix corresponde à Shortlist
// fornecida, que um ADJUST só usa providers presentes e suficientemente
// fundamentados na matriz, que a contagem final é sempre três quando
// validado, e montar o artefato com rastreabilidade correta.

import { isEssentiallyQualified, type CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import {
  createHumanReviewResult,
  type HumanReviewResult,
  type ProviderChange,
  type ReviewAction,
} from "@/modules/ace/artifacts/human-review-result";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";

const METHOD_VERSION = "ACE-0.1";
const REQUIRED_APPROVED_SIZE = 3;

export type P009Input = {
  shortlist: Shortlist;
  compatibilityMatrix: CompatibilityMatrix;
  reviewerId: string;
  reviewAction: ReviewAction;
  reviewRationale: string;
  evidenceReferences?: string[];
  // Obrigatório e não vazio quando reviewAction === "ADJUST"; ignorado
  // (deve estar ausente/vazio) para as demais ações.
  changes?: ProviderChange[];
  // Só tem efeito para REJECT/REQUEST_MORE_INFORMATION — nunca aplicável
  // quando a revisão resulta em VALIDATED.
  returnToProtocol?: ProtocolId | null;
};

function assertMatrixMatchesShortlist(shortlist: Shortlist, compatibilityMatrix: CompatibilityMatrix): void {
  if (
    shortlist.sourceArtifact.artifactId !== compatibilityMatrix.id ||
    shortlist.sourceArtifact.artifactVersion !== compatibilityMatrix.version
  ) {
    throw new ProtocolError({
      code: "INVALID_INPUT",
      protocolId: "P009",
      message:
        "A CompatibilityMatrix fornecida não é a mesma que originou a Shortlist fornecida (id/versão não correspondem).",
    });
  }
}

function buildReferences(shortlist: Shortlist, compatibilityMatrix: CompatibilityMatrix) {
  return {
    originalShortlistReference: {
      artifactId: shortlist.id,
      artifactVersion: shortlist.version,
      artifactType: "Shortlist" as const,
    },
    compatibilityMatrixReference: {
      artifactId: compatibilityMatrix.id,
      artifactVersion: compatibilityMatrix.version,
      artifactType: "CompatibilityMatrix" as const,
    },
  };
}

function applyChanges(baseline: string[], changes: ProviderChange[]): string[] {
  const result = new Set(baseline);
  for (const change of changes) {
    if (change.type === "removed") {
      result.delete(change.providerId);
    } else {
      result.add(change.providerId);
    }
  }
  return [...result].sort((a, b) => a.localeCompare(b));
}

// Valida a alteração proposta pelo revisor e retorna o conjunto final de
// providers aprovados. Nunca decide QUAL alteração fazer — apenas
// verifica se a alteração já decidida pelo humano é estruturalmente
// válida (Regras para ADJUST, specification.md).
function assertValidAdjustmentAndComputeApproved(
  baseline: string[],
  changes: ProviderChange[],
  compatibilityMatrix: CompatibilityMatrix,
): string[] {
  const entryById = new Map(compatibilityMatrix.entries.map((entry) => [entry.providerId, entry]));

  for (const change of changes) {
    if (change.type === "removed" && !baseline.includes(change.providerId)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId: "P009",
        message: `Não é possível remover "${change.providerId}": não fazia parte da composição original da Shortlist.`,
      });
    }

    if (change.type === "added") {
      const entry = entryById.get(change.providerId);

      if (!entry) {
        throw new ProtocolError({
          code: "VALIDATION_FAILED",
          protocolId: "P009",
          message: `Não é possível adicionar "${change.providerId}": não está presente na CompatibilityMatrix. Se for necessário considerar este provider, o caso deve retornar ao estágio apropriado do pipeline — nunca ser inserido informalmente no P009.`,
        });
      }

      if (!isEssentiallyQualified(entry)) {
        throw new ProtocolError({
          code: "VALIDATION_FAILED",
          protocolId: "P009",
          message: `Não é possível adicionar "${change.providerId}": análise insuficiente em requisito essencial (competencyAlignment/experienceAlignment).`,
        });
      }
    }
  }

  const approvedProviderIds = applyChanges(baseline, changes);

  if (approvedProviderIds.length !== REQUIRED_APPROVED_SIZE) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P009",
      message: `Após aplicar as alterações, restam ${approvedProviderIds.length} providers aprovados — ADJUST deve sempre resultar em exatamente ${REQUIRED_APPROVED_SIZE}.`,
    });
  }

  return approvedProviderIds;
}

export const p009HumanReview: ProtocolContract<P009Input, HumanReviewResult> = {
  id: "P009",
  name: "Human Review",
  async execute(input: P009Input): Promise<HumanReviewResult> {
    assertMatrixMatchesShortlist(input.shortlist, input.compatibilityMatrix);

    const references = buildReferences(input.shortlist, input.compatibilityMatrix);
    const reviewedAt = new Date().toISOString();
    const evidenceReferences = input.evidenceReferences ?? [];
    const changes = input.changes ?? [];

    if (input.reviewAction === "APPROVE") {
      if (input.shortlist.status !== "COMPOSED") {
        throw new ProtocolError({
          code: "VALIDATION_FAILED",
          protocolId: "P009",
          message:
            "APPROVE só é válido quando a Shortlist está COMPOSED — uma Shortlist BLOCKED não tem composição para aprovar integralmente. Use ADJUST para propor uma composição, ou REQUEST_MORE_INFORMATION/REJECT.",
        });
      }

      return createHumanReviewResult({
        reviewerId: input.reviewerId,
        reviewedAt,
        reviewStatus: "VALIDATED",
        reviewAction: "APPROVE",
        ...references,
        approvedProviderIds: input.shortlist.selectedProviderIds,
        changes: [],
        reviewRationale: input.reviewRationale,
        evidenceReferences,
        returnToProtocol: null,
        methodVersion: METHOD_VERSION,
      });
    }

    if (input.reviewAction === "ADJUST") {
      const baseline = input.shortlist.status === "COMPOSED" ? input.shortlist.selectedProviderIds : [];
      const approvedProviderIds = assertValidAdjustmentAndComputeApproved(baseline, changes, input.compatibilityMatrix);

      return createHumanReviewResult({
        reviewerId: input.reviewerId,
        reviewedAt,
        reviewStatus: "VALIDATED",
        reviewAction: "ADJUST",
        ...references,
        approvedProviderIds,
        changes,
        reviewRationale: input.reviewRationale,
        evidenceReferences,
        returnToProtocol: null,
        methodVersion: METHOD_VERSION,
      });
    }

    if (input.reviewAction === "REJECT") {
      return createHumanReviewResult({
        reviewerId: input.reviewerId,
        reviewedAt,
        reviewStatus: "REJECTED",
        reviewAction: "REJECT",
        ...references,
        approvedProviderIds: [],
        changes: [],
        reviewRationale: input.reviewRationale,
        evidenceReferences,
        returnToProtocol: input.returnToProtocol ?? null,
        methodVersion: METHOD_VERSION,
      });
    }

    // REQUEST_MORE_INFORMATION
    return createHumanReviewResult({
      reviewerId: input.reviewerId,
      reviewedAt,
      reviewStatus: "INFORMATION_REQUESTED",
      reviewAction: "REQUEST_MORE_INFORMATION",
      ...references,
      approvedProviderIds: [],
      changes: [],
      reviewRationale: input.reviewRationale,
      evidenceReferences,
      returnToProtocol: input.returnToProtocol ?? null,
      methodVersion: METHOD_VERSION,
    });
  },
};
