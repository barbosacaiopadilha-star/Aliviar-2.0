import { describe, expect, it } from "vitest";

import { createDecisionContext, type DecisionContext } from "@/modules/ace/artifacts/decision-context";
import { createCompetencyProfile, type CompetencyProfile } from "@/modules/ace/artifacts/competency-profile";
import { createEligibleProviderSet, type EligibleProviderSet } from "@/modules/ace/artifacts/eligible-provider-set";
import type { CompatibilityEntry } from "@/modules/ace/artifacts/compatibility-matrix";
import { p007CompatibilityMatrixBuilder } from "@/modules/ace/protocols/p007-compatibility-matrix-builder";
import { InMemoryProviderProfileRepository } from "@/modules/ace/ports/in-memory-provider-profile-repository";
import type { CareProviderProfile } from "@/modules/ace/ports/provider-profile-repository";

function buildDecisionContext(overrides: Partial<Parameters<typeof createDecisionContext>[0]> = {}): DecisionContext {
  return createDecisionContext({
    decisionType: "buscar_acompanhamento",
    objective: "Ter um espaço de escuta para lidar com a ansiedade.",
    clinicalDomain: "saude_emocional_mental",
    complexity: "baixa",
    urgency: "nao_determinado",
    strategy: "conexao_direta",
    mandatoryConstraints: [],
    assumptions: [],
    rationale: "Contexto de teste.",
    sourceArtifacts: [
      { artifactId: "decision-case-1", artifactVersion: 1, artifactType: "DecisionCase" },
      { artifactId: "case-audit-1", artifactVersion: 1, artifactType: "CaseAudit" },
    ],
    methodVersion: "ACE-0.1",
    ...overrides,
  });
}

function buildCompetencyProfile(
  overrides: Partial<Parameters<typeof createCompetencyProfile>[0]> = {},
): CompetencyProfile {
  return createCompetencyProfile({
    domain: "saude_emocional_mental",
    focus: "acompanhamento_continuo",
    experienceLevel: "geral",
    rationale: "Perfil de teste.",
    assumptions: [],
    sourceArtifacts: [
      { artifactId: "decision-context-1", artifactVersion: 1, artifactType: "DecisionContext" },
    ],
    methodVersion: "ACE-0.1",
    ...overrides,
  });
}

function buildEligibleSet(providerIds: string[]): EligibleProviderSet {
  return createEligibleProviderSet({
    eligibleProviderIds: [...providerIds].sort((a, b) => a.localeCompare(b)),
    evaluatedCandidates: providerIds.map((id) => ({
      providerId: id,
      eligible: true,
      reason: "Atende a todos os requisitos.",
    })),
    sourceArtifacts: [
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
    ],
    methodVersion: "ACE-0.1",
  });
}

function buildProfile(overrides: Partial<CareProviderProfile> & { providerId: string }): CareProviderProfile {
  return {
    providerType: "individual",
    status: "active",
    competencyAreas: [{ domain: "saude_emocional_mental", focus: "acompanhamento_continuo" }],
    experienceLevel: "geral",
    recordVersion: 1,
    lastVerifiedAt: "2026-07-12T00:00:00.000Z",
    intakeApproach: "conexao_direta",
    offersContinuousCare: true,
    availabilityWindow: "flexible",
    ...overrides,
  };
}

// Remove os campos voláteis (carimbados no momento da execução) para
// comparações de determinismo — duas execuções não compartilham o mesmo
// `createdAt` de parede, mas todo o resto deve ser idêntico.
function stripVolatile(entry: CompatibilityEntry) {
  const { createdAt: _createdAt, ...rest } = entry;
  return rest;
}

describe("P007 — Compatibility Matrix Builder (transição P006 → P007)", () => {
  it("T01 — provider totalmente aderente (forte alinhamento)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A", experienceLevel: "altamente_experiente" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.competencyAlignment.classification).toBe("STRONG");
    expect(entry.dimensionResults.experienceAlignment.classification).toBe("STRONG");
    expect(entry.strengths.length).toBeGreaterThan(0);
  });

  it("T02 — alinhamento adequado (experiência exatamente igual)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile({ experienceLevel: "geral" });
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A", experienceLevel: "geral" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.entries[0].dimensionResults.experienceAlignment.classification).toBe("ADEQUATE");
  });

  it("T03 — provider parcialmente aderente (estratégia diverge)", async () => {
    const decisionContext = buildDecisionContext({ strategy: "conexao_direta" });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A", intakeApproach: "avaliacao_inicial" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.strategyAlignment.classification).toBe("PARTIAL");
    expect(entry.limitations.length).toBeGreaterThan(0);
    // Limitação, não informação ausente — o dado existe, apenas diverge.
    expect(entry.missingInformation).toHaveLength(0);
  });

  it("T04 — provider com limitações não deve poluir missingInformation", async () => {
    const decisionContext = buildDecisionContext({ urgency: "alta" });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A", availabilityWindow: "limited" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.contextAlignment.classification).toBe("PARTIAL");
    expect(entry.limitations.length).toBeGreaterThan(0);
    // Limitação qualitativa (dado presente, alinhamento parcial) — distinta
    // de informação ausente.
    expect(entry.missingInformation).toHaveLength(0);
  });

  it("T05 — informação insuficiente (disponibilidade não registrada)", async () => {
    const decisionContext = buildDecisionContext({ urgency: "alta" });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A", availabilityWindow: null }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.contextAlignment.classification).toBe("INSUFFICIENT");
    // Informação ausente, distinta de uma limitação qualitativa.
    expect(entry.missingInformation.length).toBeGreaterThan(0);
    expect(entry.limitations).toHaveLength(0);
  });

  it("T06 — dimensão não aplicável (tipo de decisão não busca acompanhamento)", async () => {
    const decisionContext = buildDecisionContext({ decisionType: "esclarecer_duvida" });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.continuityAlignment.classification).toBe("NOT_APPLICABLE");
    expect(entry.dimensionResults.constraintAlignment.classification).toBe("NOT_APPLICABLE");
  });

  it("T06b — constraintAlignment não aplicável quando o caso não tem restrições obrigatórias (ADR-015)", async () => {
    const decisionContext = buildDecisionContext({ mandatoryConstraints: [] });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.entries[0].dimensionResults.constraintAlignment.classification).toBe("NOT_APPLICABLE");
  });

  it("T06c — constraintAlignment insuficiente quando há restrições mas o perfil não tem dado estruturado (ADR-015)", async () => {
    const decisionContext = buildDecisionContext({
      mandatoryConstraints: [
        {
          description: "Não pode ser presencial.",
          sourceType: "fato_relatado",
          originEvidence: { quote: "só posso por vídeo", source: "narrativa" },
        },
      ],
    });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.constraintAlignment.classification).toBe("INSUFFICIENT");
    expect(entry.dimensionResults.constraintAlignment.evidence.some((e) => e.includes("presencial"))).toBe(true);
    expect(entry.missingInformation.some((m) => m.includes("restrições"))).toBe(true);
  });

  it("T07 — informação insuficiente sem invenção (perfil completo não encontrado)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A", "provider-missing"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const missing = matrix.entries.find((e) => e.providerId === "provider-missing");
    expect(missing).toBeDefined();
    expect(missing?.dimensionResults.competencyAlignment.classification).toBe("INSUFFICIENT");
    expect(missing?.missingInformation.some((m) => m.includes("perfil completo"))).toBe(true);
  });

  it("T08 — nenhum provider perdido (múltiplos providers preservados)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A", "provider-B", "provider-C"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A" }),
      buildProfile({ providerId: "provider-B" }),
      buildProfile({ providerId: "provider-C" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.entries).toHaveLength(3);
    expect(matrix.entries.map((e) => e.providerId).sort()).toEqual(["provider-A", "provider-B", "provider-C"]);
  });

  it("T09 — nenhum ranking produzido", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A", "provider-B"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A" }),
      buildProfile({ providerId: "provider-B" }),
    ]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix).not.toHaveProperty("ranking");
    expect(matrix).not.toHaveProperty("shortlist");
    for (const entry of matrix.entries) {
      expect(entry).not.toHaveProperty("rank");
      expect(entry).not.toHaveProperty("position");
    }
  });

  it("T10 — nenhum score numérico ou percentual em nenhuma dimensão", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix).not.toHaveProperty("score");
    expect(matrix).not.toHaveProperty("percentage");
    const entry = matrix.entries[0];
    for (const dimension of Object.values(entry.dimensionResults)) {
      expect(typeof dimension.classification).toBe("string");
      expect(Number.isNaN(Number(dimension.classification))).toBe(true);
    }
  });

  it("T11 — justificativas completas (geral e por dimensão)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.rationale.length).toBeGreaterThan(0);
    for (const dimension of Object.values(entry.dimensionResults)) {
      expect(dimension.rationale.length).toBeGreaterThan(0);
    }
  });

  it("T12 — evidências utilizadas presentes nas dimensões aplicáveis", async () => {
    const decisionContext = buildDecisionContext({ urgency: "alta" });
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const entry = matrix.entries[0];
    expect(entry.dimensionResults.competencyAlignment.evidence.length).toBeGreaterThan(0);
    expect(entry.dimensionResults.contextAlignment.evidence.length).toBeGreaterThan(0);
  });

  it("T13 — resultado determinístico entre execuções", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A", "provider-B"]);
    const repo = new InMemoryProviderProfileRepository([
      buildProfile({ providerId: "provider-A" }),
      buildProfile({ providerId: "provider-B" }),
    ]);

    const matrix1 = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });
    const matrix2 = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix1.entries.map(stripVolatile)).toEqual(matrix2.entries.map(stripVolatile));
  });

  it("T14 — imutabilidade da matriz", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(() => {
      (matrix as { entries: unknown[] }).entries = [];
    }).toThrow();
    expect(() => {
      (matrix.entries as unknown[]).push({});
    }).toThrow();
  });

  it("T15 — producedBy correto na matriz e em cada entrada", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.producedBy).toBe("P007");
    expect(matrix.entries[0].producedBy).toBe("P007");
    expect(matrix.entries[0].version).toBe(1);
    expect(typeof matrix.entries[0].createdAt).toBe("string");
  });

  it("T16 — referências aos três artefatos de origem, na matriz e em cada entrada", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    const expectedSourceArtifacts = [
      { artifactId: decisionContext.id, artifactVersion: decisionContext.version, artifactType: "DecisionContext" },
      { artifactId: competencyProfile.id, artifactVersion: competencyProfile.version, artifactType: "CompetencyProfile" },
      { artifactId: eligibleSet.id, artifactVersion: eligibleSet.version, artifactType: "EligibleProviderSet" },
    ];

    expect(matrix.sourceArtifacts).toEqual(expectedSourceArtifacts);
    expect(matrix.entries[0].sourceArtifacts).toEqual(expectedSourceArtifacts);
  });

  it("T17 — compatibilidade P006 → P007: aceita eligibleProviderIds vazio sem erro", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet([]);
    const repo = new InMemoryProviderProfileRepository([]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.entries).toHaveLength(0);
  });

  it("T18 — independência da implementação do repositório", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const profiles = [buildProfile({ providerId: "provider-A" })];
    const repoA = new InMemoryProviderProfileRepository(profiles);
    const repoB = new InMemoryProviderProfileRepository([...profiles]);

    const matrixA = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repoA,
    });
    const matrixB = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repoB,
    });

    expect(matrixA.entries.map(stripVolatile)).toEqual(matrixB.entries.map(stripVolatile));
  });

  it("T19 — transição P006 → P007 ponta a ponta, sem alterar artefatos de origem", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const dcSnapshot = JSON.stringify(decisionContext);
    const cpSnapshot = JSON.stringify(competencyProfile);
    const epsSnapshot = JSON.stringify(eligibleSet);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(JSON.stringify(decisionContext)).toBe(dcSnapshot);
    expect(JSON.stringify(competencyProfile)).toBe(cpSnapshot);
    expect(JSON.stringify(eligibleSet)).toBe(epsSnapshot);
    expect(matrix.entries).toHaveLength(1);
  });

  it("T20 — nunca exclui um provider elegível, mesmo com dado insuficiente", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A", "provider-missing"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix.entries).toHaveLength(2);
  });

  it("T21 — nunca sugere/seleciona um especialista (ausência de campo de decisão)", async () => {
    const decisionContext = buildDecisionContext();
    const competencyProfile = buildCompetencyProfile();
    const eligibleSet = buildEligibleSet(["provider-A"]);
    const repo = new InMemoryProviderProfileRepository([buildProfile({ providerId: "provider-A" })]);

    const matrix = await p007CompatibilityMatrixBuilder.execute({
      decisionContext,
      competencyProfile,
      eligibleProviderSet: eligibleSet,
      providerProfileRepository: repo,
    });

    expect(matrix).not.toHaveProperty("selectedProvider");
    expect(matrix).not.toHaveProperty("finalDecision");
    expect(matrix.decisional).toBe(false);
  });
});
