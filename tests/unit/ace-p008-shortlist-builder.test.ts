import { describe, expect, it } from "vitest";

import {
  createCompatibilityMatrix,
  type AlignmentLevel,
  type CompatibilityMatrix,
  type CreateCompatibilityEntryInput,
  type DimensionResult,
} from "@/modules/ace/artifacts/compatibility-matrix";
import { p008ShortlistBuilder } from "@/modules/ace/protocols/p008-shortlist-builder";

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

describe("P008 — Shortlist Builder (transição P007 → P008)", () => {
  it("exatamente três candidatos suficientemente fundamentados compõem a Shortlist", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.status).toBe("COMPOSED");
    expect(shortlist.blockedReason).toBeNull();
    expect(shortlist.selectedProviderIds).toEqual(["provider-A", "provider-B", "provider-C"]);
  });

  it("mais de três candidatos igualmente fundamentados: bloqueado por composição ambígua, nunca escolhido alfabeticamente", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-D"),
      buildEntry("provider-B"),
      buildEntry("provider-A"),
      buildEntry("provider-C"),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.status).toBe("BLOCKED");
    expect(shortlist.blockedReason).toBe("AMBIGUOUS_COMPOSITION");
    expect(shortlist.selectedProviderIds).toHaveLength(0);
  });

  it("bloqueio por composição ambígua preserva todos os candidatos aptos, com justificativa individual", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-D"),
      buildEntry("provider-B"),
      buildEntry("provider-A"),
      buildEntry("provider-C"),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.candidateProviderIds).toEqual(["provider-A", "provider-B", "provider-C", "provider-D"]);
    expect(shortlist.providerRationales).toHaveLength(4);
    for (const rationale of shortlist.providerRationales) {
      expect(rationale.rationale.length).toBeGreaterThan(0);
    }
  });

  it("providerId apenas organiza a serialização, nunca seleciona: candidateProviderIds independe da ordem de entrada", async () => {
    const matrixA = buildMatrix([
      buildEntry("provider-D"),
      buildEntry("provider-C"),
      buildEntry("provider-B"),
      buildEntry("provider-A"),
    ]);
    const matrixB = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D"),
    ]);

    const shortlistA = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrixA });
    const shortlistB = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrixB });

    expect(shortlistA.status).toBe("BLOCKED");
    expect(shortlistA.candidateProviderIds).toEqual(shortlistB.candidateProviderIds);
    expect(shortlistA.candidateProviderIds).toEqual(["provider-A", "provider-B", "provider-C", "provider-D"]);
  });

  it("menos de três candidatos no total: bloqueado por insuficiência de opções", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.status).toBe("BLOCKED");
    expect(shortlist.blockedReason).toBe("INSUFFICIENT_OPTIONS");
    expect(shortlist.selectedProviderIds).toHaveLength(0);
    expect(shortlist.providerRationales.length).toBeLessThanOrEqual(2);
  });

  it("menos de três análises suficientemente fundamentadas: bloqueado por insuficiência de evidências", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B", { competencyAlignment: "INSUFFICIENT" }),
      buildEntry("provider-C", { experienceAlignment: "INSUFFICIENT" }),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.status).toBe("BLOCKED");
    expect(shortlist.blockedReason).toBe("INSUFFICIENT_EVIDENCE");
    expect(shortlist.compositionRationale).toMatch(/1 de 3/);
  });

  it("provider com informação insuficiente em requisito essencial é excluído da qualificação", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A"),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
      buildEntry("provider-D", { competencyAlignment: "INSUFFICIENT" }),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.status).toBe("COMPOSED");
    expect(shortlist.selectedProviderIds).not.toContain("provider-D");
  });

  it("justificativa individual por provider selecionado", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.providerRationales).toHaveLength(3);
    for (const rationale of shortlist.providerRationales) {
      expect(rationale.rationale.length).toBeGreaterThan(0);
    }
  });

  it("justificativa da composição do conjunto", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.compositionRationale.length).toBeGreaterThan(0);
  });

  it("limitações relevantes são preservadas, nunca ocultadas", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A", { strategyAlignment: "PARTIAL" }),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.relevantLimitations.some((l) => l.startsWith("provider-A:"))).toBe(true);
  });

  it("informação ausente relevante é preservada", async () => {
    const matrix = buildMatrix([
      buildEntry("provider-A", { contextAlignment: "INSUFFICIENT" }),
      buildEntry("provider-B"),
      buildEntry("provider-C"),
    ]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.missingInformation.some((m) => m.startsWith("provider-A:"))).toBe(true);
  });

  it("nunca produz ranking (nenhum campo de posição/rank)", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist).not.toHaveProperty("ranking");
    expect(shortlist).not.toHaveProperty("rank");
    expect(shortlist).not.toHaveProperty("firstPlace");
    expect(shortlist).not.toHaveProperty("winner");
  });

  it("nunca produz score numérico", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist).not.toHaveProperty("score");
    expect(shortlist).not.toHaveProperty("percentage");
  });

  it("ordem neutra e determinística (providerId) na composição, nunca ranking", async () => {
    const matrixA = buildMatrix([buildEntry("provider-C"), buildEntry("provider-A"), buildEntry("provider-B")]);
    const matrixB = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlistA = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrixA });
    const shortlistB = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrixB });

    expect(shortlistA.selectedProviderIds).toEqual(shortlistB.selectedProviderIds);
    expect(shortlistA.selectedProviderIds).toEqual(["provider-A", "provider-B", "provider-C"]);
  });

  it("imutabilidade da Shortlist", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(() => {
      (shortlist as { selectedProviderIds: unknown[] }).selectedProviderIds = [];
    }).toThrow();
    expect(() => {
      (shortlist.selectedProviderIds as unknown[]).push("provider-Z");
    }).toThrow();
  });

  it("producedBy correto", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.producedBy).toBe("P008");
  });

  it("decisional: false", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.decisional).toBe(false);
  });

  it("rastreabilidade até a CompatibilityMatrix de origem", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const shortlist = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist.sourceArtifact).toEqual({
      artifactId: matrix.id,
      artifactVersion: matrix.version,
      artifactType: "CompatibilityMatrix",
    });
  });

  it("transição P007 → P008: a CompatibilityMatrix original permanece inalterada", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);
    const snapshot = JSON.stringify(matrix);

    await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(JSON.stringify(matrix)).toBe(snapshot);
  });

  it("resultado determinístico entre execuções", async () => {
    const matrix = buildMatrix([buildEntry("provider-A"), buildEntry("provider-B"), buildEntry("provider-C")]);

    const shortlist1 = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });
    const shortlist2 = await p008ShortlistBuilder.execute({ compatibilityMatrix: matrix });

    expect(shortlist1.selectedProviderIds).toEqual(shortlist2.selectedProviderIds);
    expect(shortlist1.providerRationales).toEqual(shortlist2.providerRationales);
    expect(shortlist1.compositionRationale).toBe(shortlist2.compositionRationale);
  });
});
