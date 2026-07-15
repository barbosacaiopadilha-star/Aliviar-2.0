// P003 — Case Audit.
// Ver docs/ace/04-specs/P003-case-audit/specification.md.
//
// Audita deterministicamente o que é estruturalmente conhecível a partir do
// DecisionCase (decisão/objetivo nulos, entradas de missingInformation).
// Achados que exigem análise semântica (contradição, ambiguidade) não são
// detectados por este código — são aceitos via `additionalFindings`, como
// se já tivessem sido identificados por um modelo de linguagem seguindo
// prompt.md (a exemplo do que P002 já faz com `extractedFields`). Ver
// changelog.md do protocolo para a limitação registrada.

import { randomUUID } from "node:crypto";

import { ProtocolError } from "@/modules/ace/core/error-contract";
import { assertFieldPolicy } from "@/modules/ace/core/field-policy";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { DecisionCase, MissingInformationField } from "@/modules/ace/artifacts/decision-case";
import {
  createCaseAudit,
  type BlockingIssue,
  type CaseAudit,
  type CaseWarning,
  type IssueCategory,
  type ReadinessStatus,
  type RecommendedQuestion,
} from "@/modules/ace/artifacts/case-audit";

const METHOD_VERSION = "ACE-0.1";

export type P003AdditionalFinding = {
  description: string;
  category: IssueCategory;
  severity: "blocking" | "warning";
  recommendedQuestion: string;
  // ADR-024 (docs/DECISIONS.md) — de que a lacuna/insuficiência trata:
  // decisão, objetivo, ou outro aspecto (ex.: restrição prática opcional).
  // Mesmo campo de DecisionCase.missingInformation (decision-case.ts).
  relatedField: MissingInformationField;
};

export type P003Input = {
  decisionCase: DecisionCase;
  additionalFindings?: P003AdditionalFinding[];
};

function auditDecisionStatement(decisionCase: DecisionCase): {
  blockingIssues: BlockingIssue[];
  recommendedQuestions: RecommendedQuestion[];
} {
  const blockingIssues: BlockingIssue[] = [];
  const recommendedQuestions: RecommendedQuestion[] = [];

  if (decisionCase.decisionStatement.decision === null) {
    const id = randomUUID();
    blockingIssues.push({
      id,
      description: "A decisão que o cliente precisa tomar ainda não está definida.",
      category: "ausencia",
    });
    recommendedQuestions.push({
      relatedIssueId: id,
      question: "Qual decisão específica você precisa tomar neste momento?",
    });
  }

  if (decisionCase.decisionStatement.goal === null) {
    const id = randomUUID();
    blockingIssues.push({
      id,
      description: "O objetivo esperado pelo cliente ainda não está definido.",
      category: "ausencia",
    });
    recommendedQuestions.push({
      relatedIssueId: id,
      question: "O que você espera alcançar ao buscar esse cuidado?",
    });
  }

  return { blockingIssues, recommendedQuestions };
}

function auditMissingInformation(decisionCase: DecisionCase): {
  warnings: CaseWarning[];
  recommendedQuestions: RecommendedQuestion[];
} {
  const warnings: CaseWarning[] = [];
  const recommendedQuestions: RecommendedQuestion[] = [];

  for (const missing of decisionCase.missingInformation) {
    if (missing.relatedField === "decision" || missing.relatedField === "goal") {
      // Já tratado como bloqueio em auditDecisionStatement, a partir do
      // campo null correspondente — evita duplicar o mesmo achado.
      continue;
    }

    const id = randomUUID();
    warnings.push({ id, description: missing.description, category: "insuficiencia" });
    recommendedQuestions.push({
      relatedIssueId: id,
      question: `Você poderia compartilhar mais sobre: ${missing.description}`,
    });
  }

  return { warnings, recommendedQuestions };
}

// ADR-024 (docs/DECISIONS.md) — Content Invariant do P003. Rejeita
// deterministicamente (nunca corrige) um achado do modelo que classifique
// uma restrição/preferência prática opcional (categoria "ausencia" ou
// "insuficiencia" não relacionada a decisão nem objetivo, isto é,
// relatedField: "other") como bloqueio — especificação.md (Casos de
// Exceção) determina que essa lacuna é sempre Warning. Ausência de decisão
// e ausência de objetivo continuam sempre bloqueantes (relatedField
// "decision"/"goal"); contradição e ambiguidade ficam fora deste invariant
// (specification.md já permite ambiguidade bloqueante quando impede uma
// análise responsável).
function assertNoInvalidPracticalBlocking(findings: P003AdditionalFinding[]): void {
  for (const finding of findings) {
    const isPracticalGapCategory = finding.category === "ausencia" || finding.category === "insuficiencia";

    if (finding.severity === "blocking" && isPracticalGapCategory && finding.relatedField === "other") {
      throw new ProtocolError({
        code: "CONTENT_INVARIANT_VIOLATION",
        protocolId: "P003",
        message:
          "Uma restrição ou preferência prática opcional nunca pode ser classificada como bloqueio (severity: \"blocking\") — apenas ausência de decisão, ausência de objetivo, contradição real ou ambiguidade que impeça uma análise responsável podem bloquear o Caso.",
      });
    }
  }
}

function applyAdditionalFindings(findings: P003AdditionalFinding[]): {
  blockingIssues: BlockingIssue[];
  warnings: CaseWarning[];
  recommendedQuestions: RecommendedQuestion[];
} {
  const blockingIssues: BlockingIssue[] = [];
  const warnings: CaseWarning[] = [];
  const recommendedQuestions: RecommendedQuestion[] = [];

  for (const finding of findings) {
    const id = randomUUID();

    if (finding.severity === "blocking") {
      blockingIssues.push({ id, description: finding.description, category: finding.category });
    } else {
      warnings.push({ id, description: finding.description, category: finding.category });
    }

    recommendedQuestions.push({ relatedIssueId: id, question: finding.recommendedQuestion });
  }

  return { blockingIssues, warnings, recommendedQuestions };
}

function computeStatus(blockingIssues: BlockingIssue[], warnings: CaseWarning[]): ReadinessStatus {
  if (blockingIssues.length > 0) {
    return "BLOCKED";
  }

  if (warnings.length > 0) {
    return "READY_WITH_WARNINGS";
  }

  return "READY";
}

export const p003CaseAudit: ProtocolContract<P003Input, CaseAudit> = {
  id: "P003",
  name: "Case Audit",
  async execute(input: P003Input): Promise<CaseAudit> {
    assertFieldPolicy(
      (input.additionalFindings ?? []) as unknown as Record<string, unknown>,
      "P003",
      "additionalFindings",
    );
    assertNoInvalidPracticalBlocking(input.additionalFindings ?? []);

    const statementAudit = auditDecisionStatement(input.decisionCase);
    const missingAudit = auditMissingInformation(input.decisionCase);
    const additional = applyAdditionalFindings(input.additionalFindings ?? []);

    const blockingIssues = [...statementAudit.blockingIssues, ...additional.blockingIssues];
    const warnings = [...missingAudit.warnings, ...additional.warnings];
    const recommendedQuestions = [
      ...statementAudit.recommendedQuestions,
      ...missingAudit.recommendedQuestions,
      ...additional.recommendedQuestions,
    ];

    return createCaseAudit({
      status: computeStatus(blockingIssues, warnings),
      blockingIssues,
      warnings,
      missingInformation: input.decisionCase.missingInformation,
      recommendedQuestions,
      auditedArtifactId: input.decisionCase.id,
      auditedArtifactVersion: input.decisionCase.version,
      methodVersion: METHOD_VERSION,
    });
  },
};
