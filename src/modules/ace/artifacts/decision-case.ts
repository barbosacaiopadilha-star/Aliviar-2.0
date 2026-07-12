// DecisionCase — artefato de saída do P002 (Case Builder).
// Ver docs/ace/04-specs/P002-case-builder/specification.md, seção "Saída".
//
// Imutável após criado, versionado, referencia a Narrative de origem por id
// (nunca por cópia), e nunca contém diagnóstico, especialidade inferida,
// nível de confiança, compatibilidade, competências ou especialistas —
// esses campos são estruturalmente ausentes do tipo, e também rejeitados em
// tempo de execução caso apareçam em um payload de extração (ver
// core/field-policy.ts), já que a extração de origem (LLM) não é tipada.
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.

import type { AnalysisArtifact, ArtifactId } from "@/modules/ace/core/artifact-contract";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion, createNextVersion } from "@/modules/ace/core/version-manager";

export type SourceType = "fato_relatado" | "inferencia_estrutural";

export type OriginEvidence = {
  quote: string;
  source: "narrativa";
};

export type DecisionStatement = {
  decision: string | null;
  goal: string | null;
  sourceType: SourceType;
  originEvidence?: OriginEvidence;
};

export type MandatoryConstraint = {
  description: string;
  sourceType: SourceType;
  originEvidence: OriginEvidence;
};

export type Preference = {
  description: string;
  sourceType: SourceType;
  originEvidence: OriginEvidence;
};

export type MissingInformationField = "decision" | "goal" | "other";

export type MissingInformation = {
  description: string;
  relatedField: MissingInformationField;
};

export type DecisionCase = AnalysisArtifact & {
  sourceNarrativeId: ArtifactId;
  decisionStatement: DecisionStatement;
  mandatoryConstraints: MandatoryConstraint[];
  preferences: Preference[];
  missingInformation: MissingInformation[];
};

export type CreateDecisionCaseInput = {
  sourceNarrativeId: ArtifactId;
  decisionStatement: DecisionStatement;
  mandatoryConstraints: MandatoryConstraint[];
  preferences: Preference[];
  missingInformation: MissingInformation[];
};

function assertRequiredFields(input: CreateDecisionCaseInput, protocolId: "P002"): void {
  if (!input.sourceNarrativeId) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "DecisionCase requer sourceNarrativeId (referência à Narrative de origem).",
    });
  }

  if (!input.decisionStatement || !input.decisionStatement.sourceType) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "DecisionCase requer decisionStatement com sourceType definido.",
    });
  }
}

function assertNullFieldsAreRegisteredAsMissing(
  input: CreateDecisionCaseInput,
  protocolId: "P002",
): void {
  const hasMissingEntryFor = (field: MissingInformationField) =>
    input.missingInformation.some((item) => item.relatedField === field);

  if (input.decisionStatement.decision === null && !hasMissingEntryFor("decision")) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message:
        "Quando decisionStatement.decision é null, deve existir uma entrada correspondente em missingInformation (relatedField: \"decision\").",
    });
  }

  if (input.decisionStatement.goal === null && !hasMissingEntryFor("goal")) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message:
        "Quando decisionStatement.goal é null, deve existir uma entrada correspondente em missingInformation (relatedField: \"goal\").",
    });
  }
}

export function createDecisionCase(input: CreateDecisionCaseInput): DecisionCase {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P002", "DecisionCase");
  assertRequiredFields(input, "P002");
  assertNullFieldsAreRegisteredAsMissing(input, "P002");

  return createInitialVersion({ ...input, decisional: false, producedBy: "P002" }) as DecisionCase;
}

export function reviseDecisionCase(
  previous: DecisionCase,
  input: CreateDecisionCaseInput,
): DecisionCase {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P002", "DecisionCase");
  assertRequiredFields(input, "P002");
  assertNullFieldsAreRegisteredAsMissing(input, "P002");

  return createNextVersion(previous, {
    ...input,
    decisional: false,
    producedBy: "P002",
  }) as DecisionCase;
}
