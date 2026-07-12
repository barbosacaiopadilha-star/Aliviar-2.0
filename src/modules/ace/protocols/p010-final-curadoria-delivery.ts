// P010 — Final Curadoria Delivery.
// Ver docs/ace/04-specs/P010-final-curadoria-delivery/specification.md.
//
// O P010 nunca decide — a decisão já ocorreu no P009 (HumanReviewResult).
// Este protocolo apenas: valida que a decisão humana é elegível para
// entrega (VALIDATED, exatamente três approvedProviderIds), valida a
// cadeia de rastreabilidade completa (CompatibilityMatrix ↔
// HumanReviewResult, DecisionContext ↔ CompatibilityMatrix, DecisionCase
// ↔ DecisionContext), busca os dados de apresentação (nunca inventa
// quando ausentes), e monta a FinalCuradoria.
//
// O conteúdo em linguagem natural (resumos, explicação do Método,
// disclaimer, "por que este provider foi incluído") é recebido já
// pronto via `presentation` — mesmo padrão já usado por P002/P003/P004
// para conteúdo que exige interpretação/geração de linguagem natural,
// fora do escopo de código determinístico. O que este protocolo valida
// mecanicamente é a AUSÊNCIA de vocabulário de ranking/decisão/clínico
// nesse texto (ver artifacts/final-curadoria.ts), não sua autoria.

import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import { createFinalCuradoria, type FinalCuradoria, type ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { ProviderPresentationRepository } from "@/modules/ace/ports/provider-presentation-repository";

const METHOD_VERSION = "ACE-0.1";
const REQUIRED_PROVIDER_COUNT = 3;

export type P010ProviderNarrative = {
  providerId: string;
  whyIncluded: string;
};

export type P010Presentation = {
  decisionSummary: string;
  clientContextSummary: string;
  comparisonSummary: string;
  methodExplanation: string;
  disclaimer: string;
  nextSteps: string[];
  providerNarratives: P010ProviderNarrative[];
};

export type P010Input = {
  humanReviewResult: HumanReviewResult;
  compatibilityMatrix: CompatibilityMatrix;
  decisionCase: DecisionCase;
  decisionContext: DecisionContext;
  providerPresentationRepository: ProviderPresentationRepository;
  presentation: P010Presentation;
};

function assertReviewIsEligibleForDelivery(humanReviewResult: HumanReviewResult): void {
  if (humanReviewResult.reviewStatus !== "VALIDATED") {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P010",
      message: `O P010 só executa sobre um HumanReviewResult com reviewStatus "VALIDATED" — recebido "${humanReviewResult.reviewStatus}". REJECT e REQUEST_MORE_INFORMATION nunca produzem uma entrega.`,
    });
  }

  if (humanReviewResult.reviewAction !== "APPROVE" && humanReviewResult.reviewAction !== "ADJUST") {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P010",
      message: `reviewAction "${humanReviewResult.reviewAction}" não pode originar uma entrega — apenas APPROVE ou ADJUST.`,
    });
  }

  if (humanReviewResult.approvedProviderIds.length !== REQUIRED_PROVIDER_COUNT) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P010",
      message: `O HumanReviewResult deve conter exatamente ${REQUIRED_PROVIDER_COUNT} approvedProviderIds — recebido ${humanReviewResult.approvedProviderIds.length}.`,
    });
  }
}

function assertMatrixMatchesReview(humanReviewResult: HumanReviewResult, compatibilityMatrix: CompatibilityMatrix): void {
  if (
    humanReviewResult.compatibilityMatrixReference.artifactId !== compatibilityMatrix.id ||
    humanReviewResult.compatibilityMatrixReference.artifactVersion !== compatibilityMatrix.version
  ) {
    throw new ProtocolError({
      code: "INVALID_INPUT",
      protocolId: "P010",
      message: "A CompatibilityMatrix fornecida não é a mesma referenciada pelo HumanReviewResult fornecido.",
    });
  }
}

function assertChainConsistency(
  compatibilityMatrix: CompatibilityMatrix,
  decisionContext: DecisionContext,
  decisionCase: DecisionCase,
): void {
  const contextRef = compatibilityMatrix.sourceArtifacts.find((ref) => ref.artifactType === "DecisionContext");
  if (!contextRef || contextRef.artifactId !== decisionContext.id || contextRef.artifactVersion !== decisionContext.version) {
    throw new ProtocolError({
      code: "INVALID_INPUT",
      protocolId: "P010",
      message: "O DecisionContext fornecido não corresponde ao referenciado pela CompatibilityMatrix.",
    });
  }

  const caseRef = decisionContext.sourceArtifacts.find((ref) => ref.artifactType === "DecisionCase");
  if (!caseRef || caseRef.artifactId !== decisionCase.id || caseRef.artifactVersion !== decisionCase.version) {
    throw new ProtocolError({
      code: "INVALID_INPUT",
      protocolId: "P010",
      message: "O DecisionCase fornecido não corresponde ao referenciado (indiretamente, via DecisionContext) pela cadeia de origem.",
    });
  }
}

function assertApprovedProvidersInMatrix(
  approvedProviderIds: string[],
  compatibilityMatrix: CompatibilityMatrix,
): void {
  const idsInMatrix = new Set(compatibilityMatrix.entries.map((entry) => entry.providerId));
  for (const providerId of approvedProviderIds) {
    if (!idsInMatrix.has(providerId)) {
      throw new ProtocolError({
        code: "INVALID_INPUT",
        protocolId: "P010",
        message: `O provider aprovado "${providerId}" não está presente na CompatibilityMatrix fornecida.`,
      });
    }
  }
}

export const p010FinalCuradoriaDelivery: ProtocolContract<P010Input, FinalCuradoria> = {
  id: "P010",
  name: "Final Curadoria Delivery",
  async execute(input: P010Input): Promise<FinalCuradoria> {
    assertReviewIsEligibleForDelivery(input.humanReviewResult);
    assertMatrixMatchesReview(input.humanReviewResult, input.compatibilityMatrix);
    assertChainConsistency(input.compatibilityMatrix, input.decisionContext, input.decisionCase);
    assertApprovedProvidersInMatrix(input.humanReviewResult.approvedProviderIds, input.compatibilityMatrix);

    const approvedProviderIds = [...input.humanReviewResult.approvedProviderIds].sort((a, b) => a.localeCompare(b));

    const presentations = await input.providerPresentationRepository.findByIds(approvedProviderIds);
    const presentationById = new Map(presentations.map((p) => [p.providerId, p]));
    const narrativeById = new Map(input.presentation.providerNarratives.map((n) => [n.providerId, n]));
    const entryById = new Map(input.compatibilityMatrix.entries.map((entry) => [entry.providerId, entry]));

    const providerPresentations: ProviderPresentation[] = approvedProviderIds.map((providerId) => {
      const presentation = presentationById.get(providerId);
      if (!presentation) {
        throw new ProtocolError({
          code: "MISSING_REQUIRED_FIELD",
          protocolId: "P010",
          message: `Dados de apresentação ausentes para o provider "${providerId}" — a entrega não pode ser gerada com dados incompletos.`,
        });
      }

      const narrative = narrativeById.get(providerId);
      if (!narrative) {
        throw new ProtocolError({
          code: "MISSING_REQUIRED_FIELD",
          protocolId: "P010",
          message: `Nenhuma narrativa de inclusão (whyIncluded) foi fornecida para o provider "${providerId}".`,
        });
      }

      // entry é garantido presente por assertApprovedProvidersInMatrix.
      const entry = entryById.get(providerId)!;

      return {
        providerId,
        displayName: presentation.displayName,
        professionalSummary: presentation.professionalSummary,
        whyIncluded: narrative.whyIncluded,
        strengthsForThisCase: entry.strengths,
        relevantLimitations: entry.limitations,
        practicalConsiderations: presentation.practicalConsiderations,
      };
    });

    const relevantLimitations = providerPresentations.flatMap((p) =>
      p.relevantLimitations.map((limitation) => `${p.providerId}: ${limitation}`),
    );
    const relevantMissingInformation = approvedProviderIds.flatMap((providerId) => {
      const entry = entryById.get(providerId)!;
      return entry.missingInformation.map((item) => `${providerId}: ${item}`);
    });

    const generatedAt = new Date().toISOString();

    return createFinalCuradoria({
      validatedBy: input.humanReviewResult.reviewerId,
      validatedAt: input.humanReviewResult.reviewedAt,
      humanReviewReference: {
        artifactId: input.humanReviewResult.id,
        artifactVersion: input.humanReviewResult.version,
        artifactType: "HumanReviewResult",
      },
      caseReference: {
        artifactId: input.decisionCase.id,
        artifactVersion: input.decisionCase.version,
        artifactType: "DecisionCase",
      },
      generatedAt,
      decisionSummary: input.presentation.decisionSummary,
      clientContextSummary: input.presentation.clientContextSummary,
      providerPresentations,
      comparisonSummary: input.presentation.comparisonSummary,
      relevantLimitations,
      relevantMissingInformation,
      nextSteps: input.presentation.nextSteps,
      methodExplanation: input.presentation.methodExplanation,
      disclaimer: input.presentation.disclaimer,
      methodVersion: METHOD_VERSION,
    });
  },
};
