// CompatibilityMatrix — artefato de saída do P007 (Compatibility Matrix
// Builder). Ver
// docs/ace/04-specs/P007-compatibility-matrix-builder/specification.md,
// seção "Saída".
//
// Produz análise comparável e explicável por Care Provider elegível — nunca
// score final único, nunca percentual global, nunca ranking. Cada dimensão
// usa uma taxonomia fechada (AlignmentLevel), nunca um número, e é
// independente das demais: classificação + justificativa + evidências.
//
// Cada CompatibilityEntry carrega sua própria rastreabilidade
// (sourceArtifacts/producedBy/version/createdAt), além da rastreabilidade
// da matriz como um todo — permite auditar a avaliação de um único provider
// isoladamente, sem depender do restante da matriz.
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.

import { randomUUID } from "node:crypto";

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { deepFreeze } from "@/modules/ace/core/deep-freeze";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import type { ProtocolId } from "@/modules/ace/core/protocol-id";

// Escala qualitativa fechada, consistente com o precedente já estabelecido
// pelo ReadinessStatus do P003 (READY/READY_WITH_WARNINGS/BLOCKED) — nomes
// em inglês, MAIÚSCULO_COM_UNDERSCORE. P004/P005 usaram valores em
// português minúsculo para suas próprias enumerações; essa divergência de
// estilo já existia antes deste protocolo e não foi criada por ele (ver
// changelog.md do P007).
export type AlignmentLevel = "STRONG" | "ADEQUATE" | "PARTIAL" | "INSUFFICIENT" | "NOT_APPLICABLE";

export type DimensionName =
  | "competencyAlignment"
  | "experienceAlignment"
  | "contextAlignment"
  | "strategyAlignment"
  | "constraintAlignment"
  | "continuityAlignment";

export const DIMENSION_NAMES: readonly DimensionName[] = [
  "competencyAlignment",
  "experienceAlignment",
  "contextAlignment",
  "strategyAlignment",
  "constraintAlignment",
  "continuityAlignment",
];

// Cada dimensão é independente das demais (Sprint 8, seção "Classificação"):
// classificação qualitativa fechada + justificativa + evidências utilizadas
// — nunca um número, nunca um percentual, nunca uma nota final.
export type DimensionResult = {
  classification: AlignmentLevel;
  rationale: string;
  evidence: string[];
};

export type CompatibilityDimensionResults = Record<DimensionName, DimensionResult>;

export type CompatibilityMatrixSourceType = "DecisionContext" | "CompetencyProfile" | "EligibleProviderSet";

export type CompatibilityMatrixSourceReference = ArtifactReference<CompatibilityMatrixSourceType>;

export type CompatibilityEntry = {
  providerId: string;
  dimensionResults: CompatibilityDimensionResults;
  strengths: string[];
  limitations: string[];
  missingInformation: string[];
  rationale: string;
  sourceArtifacts: CompatibilityMatrixSourceReference[];
  producedBy: ProtocolId;
  version: number;
  createdAt: string;
};

export type CompatibilityMatrix = AnalysisArtifact & {
  entries: CompatibilityEntry[];
  sourceArtifacts: CompatibilityMatrixSourceReference[];
  methodVersion: string;
};

export type CreateCompatibilityEntryInput = {
  providerId: string;
  dimensionResults: CompatibilityDimensionResults;
  strengths: string[];
  limitations: string[];
  missingInformation: string[];
  rationale: string;
};

export type CreateCompatibilityMatrixInput = {
  entries: CreateCompatibilityEntryInput[];
  sourceArtifacts: CompatibilityMatrixSourceReference[];
  methodVersion: string;
};

const VALID_ALIGNMENT_LEVELS = new Set<AlignmentLevel>([
  "STRONG",
  "ADEQUATE",
  "PARTIAL",
  "INSUFFICIENT",
  "NOT_APPLICABLE",
]);

function assertRequiredFields(input: CreateCompatibilityMatrixInput, protocolId: "P007"): void {
  if (!input.sourceArtifacts || input.sourceArtifacts.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "CompatibilityMatrix requer ao menos uma referência em sourceArtifacts.",
    });
  }

  for (const entry of input.entries) {
    if (!entry.rationale) {
      throw new ProtocolError({
        code: "MISSING_REQUIRED_FIELD",
        protocolId,
        message: `A avaliação do provider "${entry.providerId}" requer uma justificativa (rationale) geral.`,
      });
    }

    for (const dimension of DIMENSION_NAMES) {
      const result = entry.dimensionResults[dimension];

      if (!result || typeof result.classification !== "string" || !VALID_ALIGNMENT_LEVELS.has(result.classification)) {
        throw new ProtocolError({
          code: "VALIDATION_FAILED",
          protocolId,
          message: `A dimensão "${dimension}" do provider "${entry.providerId}" precisa de uma classificação qualitativa válida — nunca um score numérico ou percentual.`,
        });
      }

      if (!result.rationale) {
        throw new ProtocolError({
          code: "MISSING_REQUIRED_FIELD",
          protocolId,
          message: `A dimensão "${dimension}" do provider "${entry.providerId}" requer justificativa própria.`,
        });
      }
    }
  }
}

function assertNoDuplicateProviders(input: CreateCompatibilityMatrixInput, protocolId: "P007"): void {
  const seen = new Set<string>();
  for (const entry of input.entries) {
    if (seen.has(entry.providerId)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `O provider "${entry.providerId}" aparece mais de uma vez em entries.`,
      });
    }
    seen.add(entry.providerId);
  }
}

// "Requisitos essenciais" (Sprint 9/10): as duas dimensões que refletem o
// próprio critério de elegibilidade já aplicado pelo P006 (domínio/foco de
// competência e nível de experiência mínimo). Compartilhado entre P008
// (Shortlist Builder) e P009 (Human Review) para que ambos concordem
// sobre o que torna um provider "suficientemente fundamentado" — nunca
// duplicado, para evitar que um dia divirjam silenciosamente.
export const ESSENTIAL_DIMENSIONS: readonly DimensionName[] = ["competencyAlignment", "experienceAlignment"];

export function isEssentiallyQualified(entry: CompatibilityEntry): boolean {
  return ESSENTIAL_DIMENSIONS.every((dimension) => entry.dimensionResults[dimension].classification !== "INSUFFICIENT");
}

export function createCompatibilityMatrix(input: CreateCompatibilityMatrixInput): CompatibilityMatrix {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P007", "CompatibilityMatrix");
  assertRequiredFields(input, "P007");
  assertNoDuplicateProviders(input, "P007");

  // Timestamp/versão gerados uma única vez e replicados para a matriz e
  // para cada entrada — garante que a rastreabilidade por provider
  // (producedBy/version/createdAt) seja idêntica à da matriz que a contém,
  // sem depender de duas chamadas independentes a Date.now().
  const createdAt = new Date().toISOString();
  const version = 1;

  const entries: CompatibilityEntry[] = input.entries.map((entry) => ({
    ...entry,
    sourceArtifacts: input.sourceArtifacts,
    producedBy: "P007",
    version,
    createdAt,
  }));

  return deepFreeze({
    id: randomUUID(),
    version,
    createdAt,
    producedBy: "P007",
    decisional: false,
    entries,
    sourceArtifacts: input.sourceArtifacts,
    methodVersion: input.methodVersion,
  }) as CompatibilityMatrix;
}
