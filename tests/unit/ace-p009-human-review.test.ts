import { describe, expect, it } from "vitest";

import {
  createCompatibilityMatrix,
  type AlignmentLevel,
  type CompatibilityMatrix,
  type CreateCompatibilityEntryInput,
  type DimensionResult,
} from "@/modules/ace/artifacts/compatibility-matrix";
import { p008ShortlistBuilder } from "@/modules/ace/protocols/p008-shortlist-builder";
import { p009HumanReview } from "@/modules/ace/protocols/p009-human-review";
import { ProtocolError } from "@/modules/ace/core/error-contract";

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

function buildMatrix(entries: CreateCompatibilityEntryInput[]): CompatibilityMatrix {
  return createCompatibilityMatrix({
    entries,
    sourceArtifacts: [
      { artifactId: "decision-context-1", artifactVersion: 1, artifactType: "DecisionContext" },
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
      { artifactId: "eligible-set-1", artifactVersion: 1, artifactType: "EligibleProviderSet" },
    ],
    methodVersion: "ACE-0.1",
  });
}

describe("P009 — Human Review (transição P008 → P009)", () => {
  it("aprovação integral (APPROVE) de uma Shortlist COMPOSED", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada.",
      evidenceReferences: ["Todos os três atendem aos requisitos essenciais."],
    });

    expect(result.reviewStatus).toBe("VALIDATED");
    expect(result.approvedProviderIds).toEqual(shortlist.selectedProviderIds);
  });

  it("ajuste válido (ADJUST) substituindo um provider por outro presente e qualificado na matriz", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D"),
    ]);
    // Matriz com 4 qualificados => Shortlist BLOCKED (AMBIGUOUS_COMPOSITION).
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    expect(shortlist.status).toBe("BLOCKED");

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "ADJUST",
      reviewRationale: "Resolução humana da composição ambígua.",
      evidenceReferences: ["Escolha entre os 4 candidatos igualmente fundamentados."],
      changes: [
        { type: "added", providerId: "provider-A", rationale: "Adequado.", evidenceReferences: ["provider-A: STRONG em competência."] },
        { type: "added", providerId: "provider-B", rationale: "Adequado.", evidenceReferences: ["provider-B: STRONG em competência."] },
        { type: "added", providerId: "provider-C", rationale: "Adequado.", evidenceReferences: ["provider-C: STRONG em competência."] },
      ],
    });

    expect(result.reviewStatus).toBe("VALIDATED");
    expect(result.approvedProviderIds).toEqual(["provider-A", "provider-B", "provider-C"]);
    expect(result.changes).toHaveLength(3);
  });

  it("rejeição (REJECT), com justificativa obrigatória", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REJECT",
      reviewRationale: "Nenhum provider atende ao caso, apesar da análise do pipeline.",
    });

    expect(result.reviewStatus).toBe("REJECTED");
    expect(result.approvedProviderIds).toHaveLength(0);
  });

  it("solicitação de mais informações (REQUEST_MORE_INFORMATION)", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REQUEST_MORE_INFORMATION",
      reviewRationale: "Faltam evidências sobre a disponibilidade real dos providers.",
    });

    expect(result.reviewStatus).toBe("INFORMATION_REQUESTED");
    expect(result.approvedProviderIds).toHaveLength(0);
  });

  it("tentativa de incluir provider fora da CompatibilityMatrix é rejeitada", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    await expect(
      p009HumanReview.execute({
        shortlist,
        compatibilityMatrix: matrix,
        reviewerId: "reviewer-1",
        reviewAction: "ADJUST",
        reviewRationale: "Tentativa inválida.",
        changes: [
          { type: "removed", providerId: "provider-A", rationale: "x", evidenceReferences: ["y"] },
          { type: "added", providerId: "provider-fora-da-matriz", rationale: "x", evidenceReferences: ["y"] },
        ],
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("tentativa de incluir provider inelegível (INSUFFICIENT em requisito essencial) é rejeitada", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D", { competencyAlignment: "INSUFFICIENT" }),
    ]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    expect(shortlist.status).toBe("COMPOSED");

    await expect(
      p009HumanReview.execute({
        shortlist,
        compatibilityMatrix: matrix,
        reviewerId: "reviewer-1",
        reviewAction: "ADJUST",
        reviewRationale: "Tentativa inválida.",
        changes: [
          { type: "removed", providerId: "provider-A", rationale: "x", evidenceReferences: ["y"] },
          { type: "added", providerId: "provider-D", rationale: "x", evidenceReferences: ["y"] },
        ],
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("Shortlist bloqueada por menos de três opções: APPROVE é rejeitado, REQUEST_MORE_INFORMATION é aceito", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    expect(shortlist.blockedReason).toBe("INSUFFICIENT_OPTIONS");

    await expect(
      p009HumanReview.execute({
        shortlist,
        compatibilityMatrix: matrix,
        reviewerId: "reviewer-1",
        reviewAction: "APPROVE",
        reviewRationale: "Tentativa inválida.",
      }),
    ).rejects.toThrow(ProtocolError);

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REQUEST_MORE_INFORMATION",
      reviewRationale: "Poucos candidatos — necessário buscar mais opções no pipeline.",
      returnToProtocol: "P006",
    });

    expect(result.reviewStatus).toBe("INFORMATION_REQUESTED");
    expect(result.returnToProtocol).toBe("P006");
  });

  it("Shortlist bloqueada por mais de três opções ambíguas: resolução humana via ADJUST", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D"),
      buildEntry("provider-E"),
    ]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    expect(shortlist.blockedReason).toBe("AMBIGUOUS_COMPOSITION");
    expect(shortlist.candidateProviderIds).toHaveLength(5);

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "ADJUST",
      reviewRationale: "Resolução humana entre os 5 candidatos igualmente fundamentados.",
      evidenceReferences: ["Critério de proximidade geográfica, fora do escopo do ACE."],
      changes: [
        { type: "added", providerId: "provider-B", rationale: "Escolhido.", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-D", rationale: "Escolhido.", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-E", rationale: "Escolhido.", evidenceReferences: ["x"] },
      ],
    });

    expect(result.reviewStatus).toBe("VALIDATED");
    expect(result.approvedProviderIds).toEqual(["provider-B", "provider-D", "provider-E"]);
  });

  it("preserva a Shortlist e a CompatibilityMatrix originais (nunca alteradas)", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const matrixSnapshot = JSON.stringify(matrix);
    const shortlistSnapshot = JSON.stringify(shortlist);

    await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada.",
      evidenceReferences: ["x"],
    });

    expect(JSON.stringify(matrix)).toBe(matrixSnapshot);
    expect(JSON.stringify(shortlist)).toBe(shortlistSnapshot);
  });

  it("trilha completa das alterações em ADJUST (providers removidos e adicionados, com justificativa e evidência)", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D"),
      buildEntry("provider-E"),
    ]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "ADJUST",
      reviewRationale: "Resolução humana.",
      evidenceReferences: ["x"],
      changes: [
        { type: "added", providerId: "provider-A", rationale: "Escolhido.", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-B", rationale: "Escolhido.", evidenceReferences: ["x"] },
        { type: "added", providerId: "provider-C", rationale: "Escolhido.", evidenceReferences: ["x"] },
      ],
    });

    for (const change of result.changes) {
      expect(change.rationale.length).toBeGreaterThan(0);
      expect(change.evidenceReferences.length).toBeGreaterThan(0);
    }
  });

  it("nunca aprova automaticamente: reviewAction reflete exatamente o que foi fornecido pelo revisor", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const rejected = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REJECT",
      reviewRationale: "Decisão do revisor, não do sistema.",
    });

    expect(rejected.reviewAction).toBe("REJECT");
    expect(rejected.reviewStatus).not.toBe("VALIDATED");
  });

  it("ValidatedCuradoria (reviewStatus VALIDATED) só ocorre após APPROVE ou ADJUST válido", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const reject = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REJECT",
      reviewRationale: "x",
    });
    const requestInfo = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "REQUEST_MORE_INFORMATION",
      reviewRationale: "x",
    });
    const approve = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    expect(reject.reviewStatus).not.toBe("VALIDATED");
    expect(requestInfo.reviewStatus).not.toBe("VALIDATED");
    expect(approve.reviewStatus).toBe("VALIDATED");
  });

  it("imutabilidade, versionamento e producedBy corretos", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    const result = await p009HumanReview.execute({
      shortlist,
      compatibilityMatrix: matrix,
      reviewerId: "reviewer-1",
      reviewAction: "APPROVE",
      reviewRationale: "x",
      evidenceReferences: ["x"],
    });

    expect(result.version).toBe(1);
    expect(result.producedBy).toBe("P009");
    expect(() => {
      (result as { reviewStatus: string }).reviewStatus = "REJECTED";
    }).toThrow();
  });

  it("transição P008 → P009: rejeita quando a CompatibilityMatrix fornecida não corresponde à Shortlist", async () => {
    const matrixA = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const matrixB = buildMatrix([buildEntry("provider-X"), buildEntry("provider-Y"), buildEntry("provider-Z")]);
    const shortlistA = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrixA });

    await expect(
      p009HumanReview.execute({
        shortlist: shortlistA,
        compatibilityMatrix: matrixB,
        reviewerId: "reviewer-1",
        reviewAction: "APPROVE",
        reviewRationale: "x",
        evidenceReferences: ["x"],
      }),
    ).rejects.toThrow(ProtocolError);
  });
});
