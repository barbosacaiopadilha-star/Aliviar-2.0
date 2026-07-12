// CompetencyProfile — artefato de saída do P005 (Competency Profile Builder).
// Ver docs/ace/04-specs/P005-competency-profile-builder/specification.md,
// seção "Saída".
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada. Descreve o perfil de competência
// relevante em termos já estabelecidos pelo DecisionContext — nunca uma
// especialidade médica, nunca um especialista.

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";
import type { ClinicalDomain } from "@/modules/ace/artifacts/decision-context";

export type CompetencyFocus =
  | "avaliacao"
  | "intervencao"
  | "acompanhamento_continuo"
  | "esclarecimento";

export type ExperienceLevel = "geral" | "experiente" | "altamente_experiente";

export type CompetencyProfileSourceType = "DecisionContext";

export type CompetencyProfileSourceReference = ArtifactReference<CompetencyProfileSourceType>;

export type CompetencyProfile = AnalysisArtifact & {
  domain: ClinicalDomain;
  focus: CompetencyFocus;
  experienceLevel: ExperienceLevel;
  rationale: string;
  assumptions: string[];
  sourceArtifacts: CompetencyProfileSourceReference[];
  methodVersion: string;
};

export type CreateCompetencyProfileInput = {
  domain: ClinicalDomain;
  focus: CompetencyFocus;
  experienceLevel: ExperienceLevel;
  rationale: string;
  assumptions: string[];
  sourceArtifacts: CompetencyProfileSourceReference[];
  methodVersion: string;
};

function assertRequiredFields(input: CreateCompetencyProfileInput, protocolId: "P005"): void {
  if (!input.rationale) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "CompetencyProfile requer rationale (justificativa da classificação).",
    });
  }

  if (!input.sourceArtifacts || input.sourceArtifacts.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "CompetencyProfile requer ao menos uma referência em sourceArtifacts.",
    });
  }
}

export function createCompetencyProfile(input: CreateCompetencyProfileInput): CompetencyProfile {
  assertFieldPolicy(
    input as unknown as Record<string, unknown>,
    "P005",
    "CompetencyProfile",
  );
  assertRequiredFields(input, "P005");

  return createInitialVersion({
    ...input,
    decisional: false,
    producedBy: "P005",
  }) as CompetencyProfile;
}
