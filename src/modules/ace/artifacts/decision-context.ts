// DecisionContext — artefato de saída do P004 (Decision Context Modeler).
// Ver docs/ace/04-specs/P004-decision-context-modeler/specification.md,
// seção "Saída".
//
// Nomenclatura oficial "Decision Context", nunca "Clinical Context"
// (ADR-011, docs/DECISIONS.md) — o Método Aliviar modela decisões, não
// doenças. clinicalDomain é deliberadamente um conjunto fechado de
// categorias amplas de vida/saúde, nunca uma taxonomia de especialidade
// médica.
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.
//
// `mandatoryConstraints` (ADR-015, docs/DECISIONS.md): as Restrições
// Obrigatórias do DecisionCase são preservadas aqui, sem reinterpretação —
// necessárias para o P007 avaliar `constraintAlignment` com dado real, em
// vez de uma dimensão estruturalmente sempre NOT_APPLICABLE.

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import type { ArtifactReference } from "@/modules/ace/core/artifact-reference";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";
import type { MandatoryConstraint } from "@/modules/ace/artifacts/decision-case";

export type DecisionType =
  | "buscar_avaliacao"
  | "decidir_intervencao"
  | "buscar_acompanhamento"
  | "esclarecer_duvida";

export type ClinicalDomain = "saude_emocional_mental" | "saude_fisica" | "nao_determinado";

export type ComplexityLevel = "baixa" | "media" | "alta";

export type UrgencyLevel = "baixa" | "media" | "alta" | "nao_determinado";

export type Strategy = "conexao_direta" | "aprofundamento_previo" | "avaliacao_inicial";

export type SourceArtifactType = "DecisionCase" | "CaseAudit";

export type SourceArtifactReference = ArtifactReference<SourceArtifactType>;

export type DecisionContext = AnalysisArtifact & {
  decisionType: DecisionType;
  objective: string | null;
  clinicalDomain: ClinicalDomain;
  complexity: ComplexityLevel;
  urgency: UrgencyLevel;
  strategy: Strategy;
  // Preservadas do DecisionCase (ADR-015), nunca criadas ou interpretadas
  // pelo P004 — apenas transportadas de forma estruturada e rastreável até
  // o P007, que é quem efetivamente as avalia (constraintAlignment).
  mandatoryConstraints: MandatoryConstraint[];
  assumptions: string[];
  rationale: string;
  sourceArtifacts: SourceArtifactReference[];
  methodVersion: string;
};

export type CreateDecisionContextInput = {
  decisionType: DecisionType;
  objective: string | null;
  clinicalDomain: ClinicalDomain;
  complexity: ComplexityLevel;
  urgency: UrgencyLevel;
  strategy: Strategy;
  mandatoryConstraints: MandatoryConstraint[];
  assumptions: string[];
  rationale: string;
  sourceArtifacts: SourceArtifactReference[];
  methodVersion: string;
};

const VALID_CLINICAL_DOMAINS = ["saude_emocional_mental", "saude_fisica", "nao_determinado"] as const;

function assertValidClinicalDomain(input: CreateDecisionContextInput, protocolId: "P004"): void {
  if (!(VALID_CLINICAL_DOMAINS as readonly string[]).includes(input.clinicalDomain)) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `clinicalDomain "${input.clinicalDomain}" não pertence ao conjunto fechado de domínios amplos permitidos — nunca deve ser uma especialidade médica.`,
    });
  }
}

function assertRequiredFields(input: CreateDecisionContextInput, protocolId: "P004"): void {
  if (!input.rationale) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "DecisionContext requer rationale (justificativa da classificação).",
    });
  }

  if (!input.sourceArtifacts || input.sourceArtifacts.length === 0) {
    throw new ProtocolError({
      code: "MISSING_REQUIRED_FIELD",
      protocolId,
      message: "DecisionContext requer ao menos uma referência em sourceArtifacts.",
    });
  }
}

export function createDecisionContext(input: CreateDecisionContextInput): DecisionContext {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P004", "DecisionContext");
  assertValidClinicalDomain(input, "P004");
  assertRequiredFields(input, "P004");

  return createInitialVersion({
    ...input,
    decisional: false,
    producedBy: "P004",
  }) as DecisionContext;
}
