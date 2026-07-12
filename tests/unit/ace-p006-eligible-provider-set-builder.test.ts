import { describe, expect, it } from "vitest";

import { createCompetencyProfile, type CompetencyProfile } from "@/modules/ace/artifacts/competency-profile";
import { p006EligibleProviderSetBuilder } from "@/modules/ace/protocols/p006-eligible-provider-set-builder";
import { InMemoryProviderRepository } from "@/modules/ace/ports/in-memory-provider-repository";
import type { CareProviderCandidate } from "@/modules/ace/ports/provider-repository";

function buildProfile(overrides: Partial<Parameters<typeof createCompetencyProfile>[0]> = {}): CompetencyProfile {
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

function buildCandidate(overrides: Partial<CareProviderCandidate> & { providerId: string }): CareProviderCandidate {
  return {
    providerType: "individual",
    status: "active",
    competencyAreas: [{ domain: "saude_emocional_mental", focus: "acompanhamento_continuo" }],
    experienceLevel: "geral",
    recordVersion: 1,
    lastVerifiedAt: "2026-07-12T00:00:00.000Z",
    ...overrides,
  };
}

describe("P006 — Eligible Provider Set Builder (transição P005 → P006)", () => {
  it("T01 — todos os requisitos atendidos: candidato é elegível", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([buildCandidate({ providerId: "provider-A" })]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual(["provider-A"]);
    expect(result.evaluatedCandidates[0].eligible).toBe(true);
  });

  it("T02 — domínio incompatível (P006 valida por conta própria, sem confiar cegamente no repositório)", async () => {
    const profile = buildProfile();
    // Repositório deliberadamente "mal-comportado": retorna um candidato de
    // domínio diferente do consultado, para verificar que o P006 aplica sua
    // própria checagem de domínio em vez de confiar que o repositório
    // sempre respeita o filtro do seu próprio contrato.
    const misbehavingRepo = {
      async findByDomain() {
        return [
          buildCandidate({
            providerId: "provider-B",
            competencyAreas: [{ domain: "saude_fisica", focus: "intervencao" }],
          }),
        ];
      },
    };

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: misbehavingRepo,
    });

    expect(result.eligibleProviderIds).toEqual([]);
    expect(result.evaluatedCandidates[0].eligible).toBe(false);
    expect(result.evaluatedCandidates[0].reason).toMatch(/domínio/i);
  });

  it("T03 — foco incompatível", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({
        providerId: "provider-B",
        competencyAreas: [{ domain: "saude_emocional_mental", focus: "avaliacao" }],
      }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual([]);
    expect(result.evaluatedCandidates[0].reason).toMatch(/foco/i);
  });

  it("T04 — experiência insuficiente", async () => {
    const profile = buildProfile({ experienceLevel: "altamente_experiente" });
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-A", experienceLevel: "geral" }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual([]);
    expect(result.evaluatedCandidates[0].reason).toMatch(/experiência/i);
  });

  it("T05 — provider inativo", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-C", status: "inactive" }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual([]);
    expect(result.evaluatedCandidates[0].reason).toMatch(/inativ/i);
  });

  it("T06 — nenhum elegível", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-C", status: "inactive" }),
      buildCandidate({ providerId: "provider-B", experienceLevel: "geral", competencyAreas: [{ domain: "saude_emocional_mental", focus: "avaliacao" }] }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual([]);
    expect(result.evaluatedCandidates).toHaveLength(2);
  });

  it("T07 — múltiplos elegíveis, ordenados por providerId", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-E" }),
      buildCandidate({ providerId: "provider-A" }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.eligibleProviderIds).toEqual(["provider-A", "provider-E"]);
  });

  it("T08 — justificativa de cada exclusão", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-C", status: "inactive" }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.evaluatedCandidates[0].reason.length).toBeGreaterThan(0);
  });

  it("T09 — ausência de ranking (nenhum campo de pontuação)", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([buildCandidate({ providerId: "provider-A" })]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("ranking");
    expect(result).not.toHaveProperty("compatibility");
  });

  it("T10 — ordenação estável entre execuções", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-E" }),
      buildCandidate({ providerId: "provider-A" }),
    ]);

    const result1 = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });
    const result2 = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result1.eligibleProviderIds).toEqual(result2.eligibleProviderIds);
  });

  it("T11 — imutabilidade", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([buildCandidate({ providerId: "provider-A" })]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(() => {
      (result as { eligibleProviderIds: string[] }).eligibleProviderIds = [];
    }).toThrow();
  });

  it("T12 — producedBy correto", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([buildCandidate({ providerId: "provider-A" })]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.producedBy).toBe("P006");
  });

  it("T13 — referência ao CompetencyProfile", async () => {
    const profile = buildProfile();
    const repo = new InMemoryProviderRepository([buildCandidate({ providerId: "provider-A" })]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(result.sourceArtifacts).toEqual([
      { artifactId: profile.id, artifactVersion: profile.version, artifactType: "CompetencyProfile" },
    ]);
  });

  it("T15 — independência da implementação do repositório", async () => {
    const profile = buildProfile();
    const candidates = [buildCandidate({ providerId: "provider-A" })];
    const repoA = new InMemoryProviderRepository(candidates);
    const repoB = new InMemoryProviderRepository([...candidates]);

    const resultA = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repoA,
    });
    const resultB = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repoB,
    });

    expect(resultA.eligibleProviderIds).toEqual(resultB.eligibleProviderIds);
  });

  it("T16 — transição P005 → P006 ponta a ponta, sem alterar o CompetencyProfile", async () => {
    const profile = buildProfile();
    const snapshot = JSON.stringify(profile);
    const repo = new InMemoryProviderRepository([
      buildCandidate({ providerId: "provider-A" }),
      buildCandidate({ providerId: "provider-C", status: "inactive" }),
    ]);

    const result = await p006EligibleProviderSetBuilder.execute({
      competencyProfile: profile,
      providerRepository: repo,
    });

    expect(JSON.stringify(profile)).toBe(snapshot);
    expect(result.eligibleProviderIds).toEqual(["provider-A"]);
    expect(result.evaluatedCandidates).toHaveLength(2);
  });
});
