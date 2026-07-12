// P006 — Eligible Provider Set Builder.
// Ver docs/ace/04-specs/P006-eligible-provider-set-builder/specification.md.
//
// Determinístico, como o P005: a regra de elegibilidade é uma comparação
// estrutural entre o CompetencyProfile e cada CareProviderCandidate
// retornado pelo ProviderRepository — nunca julgamento semântico, nunca
// ranking. O protocolo conhece apenas a interface ProviderRepository,
// nunca sua implementação (ADR-013, docs/DECISIONS.md).

import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { CompetencyProfile, ExperienceLevel } from "@/modules/ace/artifacts/competency-profile";
import {
  createEligibleProviderSet,
  type EligibilityEvaluation,
  type EligibleProviderSet,
} from "@/modules/ace/artifacts/eligible-provider-set";
import type { CareProviderCandidate, ProviderRepository } from "@/modules/ace/ports/provider-repository";

const METHOD_VERSION = "ACE-0.1";

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  geral: 1,
  experiente: 2,
  altamente_experiente: 3,
};

export type P006Input = {
  competencyProfile: CompetencyProfile;
  providerRepository: ProviderRepository;
};

function evaluateCandidate(
  candidate: CareProviderCandidate,
  profile: CompetencyProfile,
): EligibilityEvaluation {
  if (candidate.status !== "active") {
    return {
      providerId: candidate.providerId,
      eligible: false,
      reason: "Provider inativo — não pode ser considerado elegível.",
    };
  }

  const matchesDomain = candidate.competencyAreas.some((area) => area.domain === profile.domain);
  if (!matchesDomain) {
    return {
      providerId: candidate.providerId,
      eligible: false,
      reason: `Nenhuma área de competência do provider corresponde ao domínio exigido ("${profile.domain}").`,
    };
  }

  const matchesFocus = candidate.competencyAreas.some(
    (area) => area.domain === profile.domain && area.focus === profile.focus,
  );
  if (!matchesFocus) {
    return {
      providerId: candidate.providerId,
      eligible: false,
      reason: `Provider possui o domínio exigido, mas não o foco exigido ("${profile.focus}").`,
    };
  }

  if (EXPERIENCE_RANK[candidate.experienceLevel] < EXPERIENCE_RANK[profile.experienceLevel]) {
    return {
      providerId: candidate.providerId,
      eligible: false,
      reason: `Nível de experiência insuficiente — requer "${profile.experienceLevel}", provider tem "${candidate.experienceLevel}".`,
    };
  }

  return {
    providerId: candidate.providerId,
    eligible: true,
    reason: "Atende a todos os requisitos: domínio, foco e nível de experiência compatíveis.",
  };
}

function byProviderId(a: { providerId: string }, b: { providerId: string }): number {
  return a.providerId.localeCompare(b.providerId);
}

export const p006EligibleProviderSetBuilder: ProtocolContract<P006Input, EligibleProviderSet> = {
  id: "P006",
  name: "Eligible Provider Set Builder",
  async execute(input: P006Input): Promise<EligibleProviderSet> {
    const candidates = await input.providerRepository.findByDomain(input.competencyProfile.domain);

    const evaluatedCandidates = candidates
      .map((candidate) => evaluateCandidate(candidate, input.competencyProfile))
      .sort(byProviderId);

    const eligibleProviderIds = evaluatedCandidates
      .filter((evaluation) => evaluation.eligible)
      .map((evaluation) => evaluation.providerId)
      .sort((a, b) => a.localeCompare(b));

    return createEligibleProviderSet({
      eligibleProviderIds,
      evaluatedCandidates,
      sourceArtifacts: [
        {
          artifactId: input.competencyProfile.id,
          artifactVersion: input.competencyProfile.version,
          artifactType: "CompetencyProfile",
        },
      ],
      methodVersion: METHOD_VERSION,
    });
  },
};
