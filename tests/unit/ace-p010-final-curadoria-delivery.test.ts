import { describe, expect, it } from "vitest";

import { createDecisionCase, type CreateDecisionCaseInput, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { p003CaseAudit } from "@/modules/ace/protocols/p003-case-audit";
import { p004DecisionContextModeler } from "@/modules/ace/protocols/p004-decision-context-modeler";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import {
  createCompatibilityMatrix,
  type AlignmentLevel,
  type CompatibilityMatrix,
  type CreateCompatibilityEntryInput,
  type DimensionResult,
} from "@/modules/ace/artifacts/compatibility-matrix";
import { p008ShortlistBuilder } from "@/modules/ace/protocols/p008-shortlist-builder";
import { p009HumanReview } from "@/modules/ace/protocols/p009-human-review";
import { p010FinalCuradoriaDelivery, type P010Presentation } from "@/modules/ace/protocols/p010-final-curadoria-delivery";
import { InMemoryProviderPresentationRepository } from "@/modules/ace/ports/in-memory-provider-presentation-repository";
import type { CareProviderPresentation } from "@/modules/ace/ports/provider-presentation-repository";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";

function dim(classification: AlignmentLevel, rationale = "Justificativa de teste.", evidence: string[] = ["Evidência de teste."]): DimensionResult {
  return { classification, rationale, evidence };
}

function buildEntry(
  providerId: string,
  overrides: Partial<Record<keyof CreateCompatibilityEntryInput["dimensionResults"], AlignmentLevel>> = {},
): CreateCompatibilityEntryInput {
  const base: AlignmentLevel = "STRONG";
  const dimensionResults = {
    competencyAlignment: dim(overrides.competencyAlignment ?? base),
    experienceAlignment: dim(overrides.experienceAlignment ?? base),
    contextAlignment: dim(overrides.contextAlignment ?? "ADEQUATE"),
    strategyAlignment: dim(overrides.strategyAlignment ?? "ADEQUATE"),
    constraintAlignment: dim(overrides.constraintAlignment ?? "NOT_APPLICABLE", "Sem restrições.", []),
    continuityAlignment: dim(overrides.continuityAlignment ?? "NOT_APPLICABLE", "Não aplicável.", []),
  };

  const limitations: string[] = [];
  const missingInformation: string[] = [];
  for (const [, result] of Object.entries(dimensionResults)) {
    if (result.classification === "PARTIAL") limitations.push("Alinhamento parcial em alguma dimensão.");
    if (result.classification === "INSUFFICIENT") missingInformation.push("Dado insuficiente em alguma dimensão.");
  }

  return {
    providerId,
    dimensionResults,
    strengths: ["Forte alinhamento em competência."],
    limitations,
    missingInformation,
    rationale: `Avaliação de teste para ${providerId}.`,
  };
}

async function buildChain(providerIds: string[]): Promise<{ decisionCase: DecisionCase; decisionContext: DecisionContext; matrix: CompatibilityMatrix }> {
  const caseInput: CreateDecisionCaseInput = {
    sourceNarrativeId: "narrative-1",
    decisionStatement: {
      decision: "Encontrar um profissional para conversar sobre a ansiedade.",
      goal: "Ter um espaço de escuta para lidar com a ansiedade.",
      sourceType: "fato_relatado",
    },
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: [],
  };
  const decisionCase = createDecisionCase(caseInput);
  const caseAudit = await p003CaseAudit.execute({ decisionCase });
  const decisionContext = await p004DecisionContextModeler.execute({
    decisionCase,
    caseAudit,
    modeling: {
      decisionType: "buscar_acompanhamento",
      objective: decisionCase.decisionStatement.goal,
      clinicalDomain: "saude_emocional_mental",
      complexity: "baixa",
      urgency: "nao_determinado",
      strategy: "conexao_direta",
      assumptions: [],
      rationale: "Decisão clara, sem restrições, sem urgência sinalizada.",
    },
  });

  const matrix = createCompatibilityMatrix({
    entries: providerIds.map((id) => buildEntry(id)),
    sourceArtifacts: [
      { artifactId: decisionContext.id, artifactVersion: decisionContext.version, artifactType: "DecisionContext" },
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
      { artifactId: "eligible-set-1", artifactVersion: 1, artifactType: "EligibleProviderSet" },
    ],
    methodVersion: "ACE-0.1",
  });

  return { decisionCase, decisionContext, matrix };
}

function buildPresentationRepo(providerIds: string[]): InMemoryProviderPresentationRepository {
  const presentations: CareProviderPresentation[] = providerIds.map((id) => ({
    providerId: id,
    displayName: `Provider ${id}`,
    professionalSummary: "Psicólogo(a) com experiência em ansiedade.",
    practicalConsiderations: ["Atendimento por vídeo."],
  }));
  return new InMemoryProviderPresentationRepository(presentations);
}

function buildPresentation(providerIds: string[]): P010Presentation {
  return {
    decisionSummary: "Você busca um espaço de escuta para lidar com a ansiedade.",
    clientContextSummary: "O caso foi modelado como busca por acompanhamento, sem urgência sinalizada.",
    comparisonSummary: "Os três providers foram selecionados por compatibilidade com o caso; a ordem é neutra.",
    methodExplanation: "A Aliviar realizou uma curadoria independente com base no seu caso.",
    disclaimer: "Esta curadoria não substitui consulta, diagnóstico ou tratamento médico.",
    nextSteps: ["Entre em contato com o provider de sua escolha."],
    providerNarratives: providerIds.map((id) => ({
      providerId: id,
      whyIncluded: `Selecionado por atender aos requisitos essenciais do caso (${id}).`,
    })),
  };
}

describe("P010 — Final Curadoria Delivery (transição P009 → P010)", () => {
  it("entrega gerada após APPROVE", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada.",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.providerPresentations.map((p) => p.providerId)).toEqual(providerIds);
    expect(curadoria.validatedBy).toBe("reviewer-1");
  });

  it("entrega gerada após ADJUST válido", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C", "provider-D"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    expect(shortlist.status).toBe("BLOCKED");

    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "ADJUST",
      reviewRationale: "Resolução humana.",
      evidenceReferences: ["x"],
      changes: [
        { type: "added", providerId: "provider-A", rationale: "x", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-B", rationale: "x", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-D", rationale: "x", evidenceReferences: ["x"] },
      ],
    });

    const approvedIds = ["provider-A", "provider-B", "provider-D"];
    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(approvedIds),
    });

    expect(curadoria.providerPresentations.map((p) => p.providerId)).toEqual(approvedIds);
  });

  it("rejeita HumanReviewResult com reviewStatus REJECTED", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REJECT",
      reviewRationale: "x",
    });

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: review,
        compatibilityMatrix: matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: buildPresentationRepo(providerIds),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("rejeita HumanReviewResult com reviewStatus INFORMATION_REQUESTED", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REQUEST_MORE_INFORMATION",
      reviewRationale: "x",
    });

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: review,
        compatibilityMatrix: matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: buildPresentationRepo(providerIds),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("exige exatamente três providers aprovados", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const tamperedReview: HumanReviewResult = { ...review, approvedProviderIds: ["provider-A", "provider-B"] };

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: tamperedReview,
        compatibilityMatrix: matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: buildPresentationRepo(providerIds),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("rejeita provider aprovado ausente na CompatibilityMatrix", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const tamperedReview: HumanReviewResult = {
      ...review,
      approvedProviderIds: ["provider-A", "provider-B", "provider-fantasma"],
    };

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: tamperedReview,
        compatibilityMatrix: matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: buildPresentationRepo(providerIds),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("rejeita quando dados de apresentação estão ausentes", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: review,
        compatibilityMatrix: matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: new InMemoryProviderPresentationRepository([]),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("fidelidade aos approvedProviderIds: nunca troca, adiciona ou remove um provider", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.providerPresentations.map((p) => p.providerId).sort()).toEqual(
      review.approvedProviderIds.slice().sort(),
    );
  });

  it("preserva justificativas (strengthsForThisCase) e limitações da CompatibilityMatrix", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    for (const presentation of curadoria.providerPresentations) {
      expect(presentation.strengthsForThisCase.length).toBeGreaterThan(0);
    }
  });

  it("preserva informações ausentes relevantes", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain([]);
    const realMatrix = createCompatibilityMatrix({
      entries: providerIds.map((id) => buildEntry(id, id === "provider-A" ? { contextAlignment: "INSUFFICIENT" } : {})),
      sourceArtifacts: matrix.sourceArtifacts,
      methodVersion: "ACE-0.1",
    });
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: realMatrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: realMatrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: realMatrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.relevantMissingInformation.some((m) => m.startsWith("provider-A:"))).toBe(true);
  });

  it("ordem neutra dos providers na entrega", async () => {
    const providerIds = ["provider-C", "provider-A", "provider-B"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(["provider-A", "provider-B", "provider-C"]),
    });

    expect(curadoria.providerPresentations.map((p) => p.providerId)).toEqual(["provider-A", "provider-B", "provider-C"]);
  });

  it("nunca contém ranking, score, diagnóstico ou tratamento", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria).not.toHaveProperty("ranking");
    expect(curadoria).not.toHaveProperty("score");
    expect(curadoria).not.toHaveProperty("diagnosis");
    expect(curadoria).not.toHaveProperty("treatment");
  });

  it("nunca toma nova decisão: decisional é sempre false", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.decisional).toBe(false);
  });

  it("proveniência da decisão humana: validatedBy e validatedAt refletem o P009", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-42",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.validatedBy).toBe("reviewer-42");
    expect(curadoria.validatedAt).toBe(review.reviewedAt);
    expect(curadoria.humanReviewReference).toEqual({
      artifactId: review.id,
      artifactVersion: review.version,
      artifactType: "HumanReviewResult",
    });
  });

  it("imutabilidade e versionamento", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.version).toBe(1);
    expect(() => {
      (curadoria as { decisionSummary: string }).decisionSummary = "alterado";
    }).toThrow();
  });

  it("producedBy correto (P010)", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria.producedBy).toBe("P010");
  });

  it("rastreabilidade completa P009 → P010: rejeita CompatibilityMatrix que não corresponde ao HumanReviewResult", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const otherChain = await buildChain(["provider-X", "provider-Y", "provider-Z"]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    await expect(
      p010FinalCuradoriaDelivery.execute({
        humanReviewResult: review,
        compatibilityMatrix: otherChain.matrix,
        decisionCase,
        decisionContext,
        providerPresentationRepository: buildPresentationRepo(providerIds),
        presentation: buildPresentation(providerIds),
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("independência da implementação da porta de dados de apresentação", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const repoA = buildPresentationRepo(providerIds);
    const repoB = buildPresentationRepo(providerIds);

    const curadoriaA = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: repoA,
      presentation: buildPresentation(providerIds),
    });
    const curadoriaB = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: repoB,
      presentation: buildPresentation(providerIds),
    });

    expect(curadoriaA.providerPresentations).toEqual(curadoriaB.providerPresentations);
  });

  it("resultado determinístico para as mesmas entradas", async () => {
    const providerIds = ["provider-A", "provider-B", "provider-C"];
    const { decisionCase, decisionContext, matrix } = await buildChain(providerIds);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const review = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    const curadoria1 = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });
    const curadoria2 = await p010FinalCuradoriaDelivery.execute({
      humanReviewResult: review,
      compatibilityMatrix: matrix,
      decisionCase,
      decisionContext,
      providerPresentationRepository: buildPresentationRepo(providerIds),
      presentation: buildPresentation(providerIds),
    });

    expect(curadoria1.providerPresentations).toEqual(curadoria2.providerPresentations);
    expect(curadoria1.decisionSummary).toBe(curadoria2.decisionSummary);
  });
});
