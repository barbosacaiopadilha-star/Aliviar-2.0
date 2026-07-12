// CaseAudit — artefato de saída do P003 (Case Audit).
// Ver docs/ace/04-specs/P003-case-audit/specification.md, seção "Saída".
//
// Nunca modifica o DecisionCase auditado (referenciado apenas por id e
// versão), e nunca contém diagnóstico, especialidade inferida, nível de
// confiança, compatibilidade, competências ou especialistas — mesma
// restrição estrutural e em runtime já aplicada ao DecisionCase (ver
// core/field-policy.ts).
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.

import type { AnalysisArtifact, ArtifactId } from "@/modules/ace/core/artifact-contract";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import { createInitialVersion } from "@/modules/ace/core/version-manager";
import type { MissingInformation } from "@/modules/ace/artifacts/decision-case";

export type ReadinessStatus = "READY" | "READY_WITH_WARNINGS" | "BLOCKED";

export type IssueCategory = "ausencia" | "contradicao" | "ambiguidade" | "insuficiencia";

export type BlockingIssue = {
  id: string;
  description: string;
  category: IssueCategory;
};

export type CaseWarning = {
  id: string;
  description: string;
  category: IssueCategory;
};

export type RecommendedQuestion = {
  relatedIssueId: string;
  question: string;
};

export type CaseAudit = AnalysisArtifact & {
  status: ReadinessStatus;
  blockingIssues: BlockingIssue[];
  warnings: CaseWarning[];
  missingInformation: MissingInformation[];
  recommendedQuestions: RecommendedQuestion[];
  auditedArtifactId: ArtifactId;
  auditedArtifactVersion: number;
  methodVersion: string;
};

export type CreateCaseAuditInput = {
  status: ReadinessStatus;
  blockingIssues: BlockingIssue[];
  warnings: CaseWarning[];
  missingInformation: MissingInformation[];
  recommendedQuestions: RecommendedQuestion[];
  auditedArtifactId: ArtifactId;
  auditedArtifactVersion: number;
  methodVersion: string;
};

function expectedStatus(
  blockingIssues: BlockingIssue[],
  warnings: CaseWarning[],
): ReadinessStatus {
  if (blockingIssues.length > 0) {
    return "BLOCKED";
  }

  if (warnings.length > 0) {
    return "READY_WITH_WARNINGS";
  }

  return "READY";
}

function assertStatusConsistency(input: CreateCaseAuditInput, protocolId: "P003"): void {
  const expected = expectedStatus(input.blockingIssues, input.warnings);

  if (input.status !== expected) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: `status "${input.status}" é inconsistente com os achados (esperado: "${expected}").`,
    });
  }
}

function assertQuestionsMatchIssues(input: CreateCaseAuditInput, protocolId: "P003"): void {
  const issueIds = new Set(
    [...input.blockingIssues, ...input.warnings].map((issue) => issue.id),
  );
  const questionIds = input.recommendedQuestions.map((question) => question.relatedIssueId);
  const questionIdSet = new Set(questionIds);

  if (questionIds.length !== questionIdSet.size) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId,
      message: "Cada item (bloqueio ou aviso) deve ter no máximo uma pergunta recomendada correspondente.",
    });
  }

  for (const id of issueIds) {
    if (!questionIdSet.has(id)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `O item "${id}" não possui uma pergunta recomendada correspondente.`,
      });
    }
  }

  for (const relatedId of questionIds) {
    if (!issueIds.has(relatedId)) {
      throw new ProtocolError({
        code: "VALIDATION_FAILED",
        protocolId,
        message: `A pergunta recomendada referencia um item inexistente: "${relatedId}".`,
      });
    }
  }
}

export function createCaseAudit(input: CreateCaseAuditInput): CaseAudit {
  assertFieldPolicy(input as unknown as Record<string, unknown>, "P003", "CaseAudit");
  assertStatusConsistency(input, "P003");
  assertQuestionsMatchIssues(input, "P003");

  return createInitialVersion({ ...input, decisional: false, producedBy: "P003" }) as CaseAudit;
}
