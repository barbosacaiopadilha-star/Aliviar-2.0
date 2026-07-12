// P007 — Compatibility Matrix Builder.
// Ver docs/ace/04-specs/P007-compatibility-matrix-builder/specification.md.
//
// Determinístico: cada dimensão é uma comparação estrutural entre o que já
// está modelado em DecisionContext/CompetencyProfile e o que o
// ProviderProfileRepository retorna — nunca julgamento semântico, nunca
// ranking, nunca score. Cada dimensão produz um DimensionResult
// (classificação + justificativa + evidências), nunca apenas um rótulo.
//
// `constraintAlignment` (ADR-015, Sprint 9 — correção sobre a v0.1/v0.2):
// as Restrições Obrigatórias do cliente agora chegam até aqui via
// `decisionContext.mandatoryConstraints` (propagadas pelo P004, nunca
// criadas ou interpretadas por ele). O CareProviderProfile ainda não
// possui nenhum campo estruturado para verificar restrições em texto
// livre (preço, convênio, localização, modalidade...) — por isso, quando
// existem restrições registradas, o resultado é `INSUFFICIENT` (dado
// insuficiente para verificar), nunca uma invenção. Só é `NOT_APPLICABLE`
// quando o caso não tem nenhuma restrição obrigatória registrada.

import type { CompetencyProfile, ExperienceLevel } from "@/modules/ace/artifacts/competency-profile";
import {
  createCompatibilityMatrix,
  DIMENSION_NAMES,
  type CompatibilityDimensionResults,
  type CompatibilityMatrix,
  type CreateCompatibilityEntryInput,
  type DimensionName,
  type DimensionResult,
} from "@/modules/ace/artifacts/compatibility-matrix";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { EligibleProviderSet } from "@/modules/ace/artifacts/eligible-provider-set";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { CareProviderProfile, ProviderProfileRepository } from "@/modules/ace/ports/provider-profile-repository";

const METHOD_VERSION = "ACE-0.1";

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  geral: 1,
  experiente: 2,
  altamente_experiente: 3,
};

const DIMENSION_LABELS: Record<DimensionName, string> = {
  competencyAlignment: "competência",
  experienceAlignment: "experiência",
  contextAlignment: "contexto/urgência",
  strategyAlignment: "estratégia de abordagem",
  constraintAlignment: "restrições",
  continuityAlignment: "continuidade de cuidado",
};

export type P007Input = {
  decisionContext: DecisionContext;
  competencyProfile: CompetencyProfile;
  eligibleProviderSet: EligibleProviderSet;
  providerProfileRepository: ProviderProfileRepository;
};

function assessCompetencyAlignment(
  profile: CareProviderProfile,
  competencyProfile: CompetencyProfile,
): DimensionResult {
  const matches = profile.competencyAreas.some(
    (area) => area.domain === competencyProfile.domain && area.focus === competencyProfile.focus,
  );

  const evidence = [
    `CompetencyProfile exige domínio "${competencyProfile.domain}" e foco "${competencyProfile.focus}".`,
    `Áreas de competência registradas do provider: ${
      profile.competencyAreas.map((a) => `${a.domain}/${a.focus}`).join(", ") || "nenhuma registrada"
    }.`,
  ];

  // Defensivo: um provider já elegível (P006) deveria sempre corresponder.
  return matches
    ? {
        classification: "STRONG",
        rationale: "O provider possui área de competência que corresponde exatamente ao domínio e foco exigidos.",
        evidence,
      }
    : {
        classification: "INSUFFICIENT",
        rationale: "Nenhuma área de competência do provider corresponde ao domínio/foco exigidos.",
        evidence,
      };
}

function assessExperienceAlignment(
  profile: CareProviderProfile,
  competencyProfile: CompetencyProfile,
): DimensionResult {
  const providerRank = EXPERIENCE_RANK[profile.experienceLevel];
  const requiredRank = EXPERIENCE_RANK[competencyProfile.experienceLevel];

  const evidence = [
    `Nível de experiência do provider: ${profile.experienceLevel}.`,
    `Nível de experiência exigido pelo CompetencyProfile: ${competencyProfile.experienceLevel}.`,
  ];

  if (providerRank > requiredRank) {
    return { classification: "STRONG", rationale: "O provider excede o nível de experiência exigido.", evidence };
  }
  if (providerRank === requiredRank) {
    return {
      classification: "ADEQUATE",
      rationale: "O provider atende exatamente ao nível de experiência exigido.",
      evidence,
    };
  }
  // Defensivo: não deveria ocorrer para um provider já elegível.
  return {
    classification: "INSUFFICIENT",
    rationale: "O provider está abaixo do nível de experiência exigido.",
    evidence,
  };
}

function assessContextAlignment(profile: CareProviderProfile, decisionContext: DecisionContext): DimensionResult {
  const evidence = [
    `Urgência do caso: ${decisionContext.urgency}.`,
    `Janela de disponibilidade do provider: ${profile.availabilityWindow ?? "não registrada"}.`,
  ];

  if (decisionContext.urgency === "nao_determinado") {
    return {
      classification: "NOT_APPLICABLE",
      rationale: "Urgência do caso não determinada — dimensão não aplicável.",
      evidence,
    };
  }

  if (profile.availabilityWindow === null) {
    return {
      classification: "INSUFFICIENT",
      rationale: "Disponibilidade do provider não registrada no repositório.",
      evidence,
    };
  }

  if (decisionContext.urgency === "alta") {
    if (profile.availabilityWindow === "flexible") {
      return {
        classification: "STRONG",
        rationale: "Disponibilidade flexível atende integralmente à urgência alta do caso.",
        evidence,
      };
    }
    if (profile.availabilityWindow === "limited") {
      return {
        classification: "PARTIAL",
        rationale: "Disponibilidade limitada atende apenas parcialmente à urgência alta do caso.",
        evidence,
      };
    }
    return {
      classification: "INSUFFICIENT",
      rationale: "Disponibilidade do provider incompatível com a urgência alta do caso.",
      evidence,
    };
  }

  if (decisionContext.urgency === "media") {
    if (profile.availabilityWindow === "flexible" || profile.availabilityWindow === "limited") {
      return {
        classification: "ADEQUATE",
        rationale: "Disponibilidade do provider atende à urgência média do caso.",
        evidence,
      };
    }
    return {
      classification: "PARTIAL",
      rationale: "Disponibilidade do provider atende apenas parcialmente à urgência média do caso.",
      evidence,
    };
  }

  // urgency === "baixa"
  return {
    classification: "ADEQUATE",
    rationale: "Urgência baixa é compatível com a disponibilidade registrada do provider.",
    evidence,
  };
}

function assessStrategyAlignment(profile: CareProviderProfile, decisionContext: DecisionContext): DimensionResult {
  const evidence = [
    `Abordagem de intake do provider: ${profile.intakeApproach}.`,
    `Estratégia do Contexto de Decisão: ${decisionContext.strategy}.`,
  ];

  if (profile.intakeApproach === "ambos") {
    return {
      classification: "STRONG",
      rationale: "O provider atende por ambas as abordagens, cobrindo integralmente a estratégia do caso.",
      evidence,
    };
  }
  if (profile.intakeApproach === decisionContext.strategy) {
    return {
      classification: "ADEQUATE",
      rationale: "A abordagem do provider corresponde exatamente à estratégia do caso.",
      evidence,
    };
  }
  return {
    classification: "PARTIAL",
    rationale: "A abordagem do provider diverge da estratégia do caso.",
    evidence,
  };
}

function assessConstraintAlignment(decisionContext: DecisionContext): DimensionResult {
  const constraints = decisionContext.mandatoryConstraints;

  if (constraints.length === 0) {
    return {
      classification: "NOT_APPLICABLE",
      rationale: "Nenhuma restrição obrigatória foi registrada para este caso.",
      evidence: [],
    };
  }

  // O perfil do Care Provider ainda não possui campos estruturados para
  // verificar restrições em texto livre — nunca inventamos a verificação;
  // registramos a lacuna (Sprint 9: "se a infraestrutura atual não possui
  // dados suficientes para avaliar uma restrição específica, registre a
  // insuficiência").
  return {
    classification: "INSUFFICIENT",
    rationale:
      "Existem restrições obrigatórias registradas para este caso, mas o perfil do Care Provider ainda não possui dados estruturados suficientes para verificá-las.",
    evidence: constraints.map((constraint) => `Restrição obrigatória: "${constraint.description}".`),
  };
}

function assessContinuityAlignment(profile: CareProviderProfile, decisionContext: DecisionContext): DimensionResult {
  const evidence = [
    `Tipo de decisão do caso: ${decisionContext.decisionType}.`,
    `Oferece cuidado contínuo: ${
      profile.offersContinuousCare === null ? "não registrado" : profile.offersContinuousCare ? "sim" : "não"
    }.`,
  ];

  if (decisionContext.decisionType !== "buscar_acompanhamento") {
    return {
      classification: "NOT_APPLICABLE",
      rationale: "O tipo de decisão do caso não envolve acompanhamento contínuo — dimensão não aplicável.",
      evidence,
    };
  }

  if (profile.offersContinuousCare === null) {
    return {
      classification: "INSUFFICIENT",
      rationale: "Não há registro sobre oferta de cuidado contínuo para este provider.",
      evidence,
    };
  }

  return profile.offersContinuousCare
    ? {
        classification: "STRONG",
        rationale: "O provider oferece cuidado contínuo, alinhado à necessidade de acompanhamento do caso.",
        evidence,
      }
    : {
        classification: "PARTIAL",
        rationale: "O provider não oferece cuidado contínuo, atendendo apenas parcialmente à necessidade do caso.",
        evidence,
      };
}

function summarize(dimensionResults: CompatibilityDimensionResults): {
  strengths: string[];
  limitations: string[];
  missingInformation: string[];
} {
  const strengths: string[] = [];
  const limitations: string[] = [];
  const missingInformation: string[] = [];

  for (const name of DIMENSION_NAMES) {
    const { classification } = dimensionResults[name];
    const label = DIMENSION_LABELS[name];

    if (classification === "STRONG") {
      strengths.push(`Forte alinhamento em ${label}.`);
    } else if (classification === "PARTIAL") {
      limitations.push(`Alinhamento parcial em ${label}.`);
    } else if (classification === "INSUFFICIENT") {
      // Distinto de "limitations": aqui falta dado, não é uma qualidade
      // parcial já observada (Sprint 8: "missingInformation" separado de
      // "limitations").
      missingInformation.push(`Dado insuficiente para avaliar ${label}.`);
    }
    // ADEQUATE e NOT_APPLICABLE não geram entrada em nenhuma das três listas.
  }

  return { strengths, limitations, missingInformation };
}

function assessProvider(
  profile: CareProviderProfile,
  decisionContext: DecisionContext,
  competencyProfile: CompetencyProfile,
): CreateCompatibilityEntryInput {
  const dimensionResults: CompatibilityDimensionResults = {
    competencyAlignment: assessCompetencyAlignment(profile, competencyProfile),
    experienceAlignment: assessExperienceAlignment(profile, competencyProfile),
    contextAlignment: assessContextAlignment(profile, decisionContext),
    strategyAlignment: assessStrategyAlignment(profile, decisionContext),
    constraintAlignment: assessConstraintAlignment(decisionContext),
    continuityAlignment: assessContinuityAlignment(profile, decisionContext),
  };

  const { strengths, limitations, missingInformation } = summarize(dimensionResults);

  return {
    providerId: profile.providerId,
    dimensionResults,
    strengths,
    limitations,
    missingInformation,
    rationale: `Avaliação determinística a partir do Contexto de Decisão e do Perfil de Competência — ${strengths.length} força(s), ${limitations.length} limitação(ões) e ${missingInformation.length} lacuna(s) de informação identificadas.`,
  };
}

function buildMissingProfileEntry(providerId: string, decisionContext: DecisionContext): CreateCompatibilityEntryInput {
  const insufficientDimension = (): DimensionResult => ({
    classification: "INSUFFICIENT",
    rationale: "Perfil completo do provider não encontrado no repositório.",
    evidence: [],
  });

  const dimensionResults: CompatibilityDimensionResults = {
    competencyAlignment: insufficientDimension(),
    experienceAlignment: insufficientDimension(),
    contextAlignment: insufficientDimension(),
    strategyAlignment: insufficientDimension(),
    constraintAlignment: assessConstraintAlignment(decisionContext),
    continuityAlignment: insufficientDimension(),
  };

  return {
    providerId,
    dimensionResults,
    strengths: [],
    limitations: [],
    // Preserva o provider mesmo sem dado completo — nunca o remove (Regras
    // do P007: "nunca excluir providers"). Nenhuma dimensão dependente de
    // perfil pôde ser avaliada; nunca inventamos o dado ausente.
    missingInformation: [
      "Dado insuficiente: o perfil completo deste provider não foi encontrado no repositório.",
    ],
    rationale:
      "Não foi possível obter o perfil completo deste provider — nenhuma dimensão dependente de perfil pôde ser avaliada.",
  };
}

export const p007CompatibilityMatrixBuilder: ProtocolContract<P007Input, CompatibilityMatrix> = {
  id: "P007",
  name: "Compatibility Matrix Builder",
  async execute(input: P007Input): Promise<CompatibilityMatrix> {
    const profiles = await input.providerProfileRepository.findByIds(
      input.eligibleProviderSet.eligibleProviderIds,
    );

    const profileById = new Map(profiles.map((profile) => [profile.providerId, profile]));

    const entries: CreateCompatibilityEntryInput[] = input.eligibleProviderSet.eligibleProviderIds.map(
      (providerId) => {
        const profile = profileById.get(providerId);

        return profile
          ? assessProvider(profile, input.decisionContext, input.competencyProfile)
          : buildMissingProfileEntry(providerId, input.decisionContext);
      },
    );

    return createCompatibilityMatrix({
      entries,
      sourceArtifacts: [
        {
          artifactId: input.decisionContext.id,
          artifactVersion: input.decisionContext.version,
          artifactType: "DecisionContext",
        },
        {
          artifactId: input.competencyProfile.id,
          artifactVersion: input.competencyProfile.version,
          artifactType: "CompetencyProfile",
        },
        {
          artifactId: input.eligibleProviderSet.id,
          artifactVersion: input.eligibleProviderSet.version,
          artifactType: "EligibleProviderSet",
        },
      ],
      methodVersion: METHOD_VERSION,
    });
  },
};
