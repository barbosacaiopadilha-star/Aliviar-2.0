// P004 — Decision Context Modeler.
// Ver docs/ace/04-specs/P004-decision-context-modeler/specification.md.
//
// A classificação semântica (decisionType, clinicalDomain, complexity,
// urgency, strategy, assumptions, rationale) exige análise de linguagem
// natural, fora de escopo deste ciclo — é aceita já pronta via `modeling`,
// equivalente ao que um modelo de linguagem produziria seguindo prompt.md
// (mesmo padrão de P002/P003). Este código valida consistência (objective
// corresponde ao DecisionCase, CaseAudit audita o DecisionCase fornecido,
// CaseAudit não está BLOCKED, sem campos proibidos) e monta/versiona o
// artefato com rastreabilidade correta às suas fontes.
//
// `mandatoryConstraints` (ADR-015): transporte mecânico, nunca via
// `modeling` — o P004 não cria nem interpreta Restrições Obrigatórias,
// apenas preserva exatamente o que já existe no DecisionCase.

import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import {
  createDecisionContext,
  type CreateDecisionContextInput,
  type DecisionContext,
} from "@/modules/ace/artifacts/decision-context";

const METHOD_VERSION = "ACE-0.1";

export type P004Modeling = Omit<
  CreateDecisionContextInput,
  "sourceArtifacts" | "methodVersion" | "mandatoryConstraints"
>;

export type P004Input = {
  decisionCase: DecisionCase;
  caseAudit: CaseAudit;
  modeling: P004Modeling;
};

function assertAuditMatchesCase(decisionCase: DecisionCase, caseAudit: CaseAudit): void {
  if (
    caseAudit.auditedArtifactId !== decisionCase.id ||
    caseAudit.auditedArtifactVersion !== decisionCase.version
  ) {
    throw new ProtocolError({
      code: "INVALID_INPUT",
      protocolId: "P004",
      message:
        "A CaseAudit fornecida não audita o DecisionCase fornecido (id/versão não correspondem).",
    });
  }
}

function assertNotBlocked(caseAudit: CaseAudit): void {
  if (caseAudit.status === "BLOCKED") {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P004",
      message:
        "Não é possível modelar o contexto de decisão: a CaseAudit está BLOCKED. Resolva as perguntas recomendadas antes de prosseguir.",
    });
  }
}

function assertObjectiveMatchesCase(decisionCase: DecisionCase, objective: string | null): void {
  if (objective !== decisionCase.decisionStatement.goal) {
    throw new ProtocolError({
      code: "VALIDATION_FAILED",
      protocolId: "P004",
      message:
        "O objective do DecisionContext deve corresponder exatamente ao goal já estabelecido no DecisionCase.",
    });
  }
}

export const p004DecisionContextModeler: ProtocolContract<P004Input, DecisionContext> = {
  id: "P004",
  name: "Decision Context Modeler",
  async execute(input: P004Input): Promise<DecisionContext> {
    assertAuditMatchesCase(input.decisionCase, input.caseAudit);
    assertNotBlocked(input.caseAudit);
    assertObjectiveMatchesCase(input.decisionCase, input.modeling.objective);

    return createDecisionContext({
      ...input.modeling,
      // Preservação mecânica (ADR-015) — nunca criada/interpretada aqui.
      mandatoryConstraints: input.decisionCase.mandatoryConstraints,
      sourceArtifacts: [
        {
          artifactId: input.decisionCase.id,
          artifactVersion: input.decisionCase.version,
          artifactType: "DecisionCase",
        },
        {
          artifactId: input.caseAudit.id,
          artifactVersion: input.caseAudit.version,
          artifactType: "CaseAudit",
        },
      ],
      methodVersion: METHOD_VERSION,
    });
  },
};
