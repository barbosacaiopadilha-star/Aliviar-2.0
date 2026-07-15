// Fixtures golden do P004 (Decision Context Modeler) —
// docs/ace/04-specs/P004-decision-context-modeler/examples.md, assertions
// derivadas de tests.md (T01, T02, T03, T05).
//
// O terceiro exemplo de examples.md ("Rejeição", CaseAudit BLOCKED) nunca
// chega a chamar o modelo de linguagem no fluxo real (o Orchestrator só
// invoca o P004 quando a CaseAudit não está BLOCKED) — por isso não vira
// fixture golden aqui; já é coberto por teste unitário determinístico de
// p004-decision-context-modeler.ts.

import { expect } from "vitest";

import { createDecisionCase, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { createCaseAudit, type CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { GoldenFixture } from "./types";

export type P004GoldenFixture = GoldenFixture<DecisionContext> & {
  decisionCase: DecisionCase;
  caseAudit: CaseAudit;
};

const originEvidence = (quote: string) => ({ quote, source: "narrativa" as const });

const simpleDecisionCase = createDecisionCase({
  sourceNarrativeId: "golden-narrative-p004-simple",
  decisionStatement: {
    decision: "Encontrar um profissional (psicólogo) para conversar sobre a ansiedade atual.",
    goal: "Ter um espaço de escuta para lidar com a ansiedade.",
    sourceType: "fato_relatado",
    originEvidence: originEvidence("A decisão que precisa tomar é encontrar esse profissional."),
  },
  mandatoryConstraints: [],
  preferences: [
    {
      description: "Prefere um espaço de conversa, sem necessidade de acompanhamento mais estruturado.",
      sourceType: "fato_relatado",
      originEvidence: originEvidence("sem sentir necessidade de um acompanhamento mais estruturado neste momento"),
    },
  ],
  missingInformation: [],
});

const intermediateDecisionCase = createDecisionCase({
  sourceNarrativeId: "golden-narrative-p004-intermediate",
  decisionStatement: {
    decision: "Decidir se a cirurgia no joelho é realmente necessária.",
    goal: "Ter clareza e segurança antes de decidir.",
    sourceType: "fato_relatado",
    originEvidence: originEvidence("Sua principal dúvida é decidir se a cirurgia é realmente necessária."),
  },
  mandatoryConstraints: [
    {
      description: "Não estar em recuperação durante a viagem de trabalho prevista para daqui a três meses.",
      sourceType: "fato_relatado",
      originEvidence: originEvidence(
        "uma viagem de trabalho importante prevista para daqui a três meses, período em que ele não gostaria de estar em recuperação",
      ),
    },
  ],
  preferences: [],
  missingInformation: [],
});

function readyAudit(decisionCase: DecisionCase): CaseAudit {
  return createCaseAudit({
    status: "READY",
    blockingIssues: [],
    warnings: [],
    missingInformation: [],
    recommendedQuestions: [],
    auditedArtifactId: decisionCase.id,
    auditedArtifactVersion: decisionCase.version,
    methodVersion: "ACE-0.1",
  });
}

export const p004Fixtures: P004GoldenFixture[] = [
  {
    name: "contexto simples — decisão clara, sem restrições (T01, T05)",
    covers: ["T01", "T05"],
    decisionCase: simpleDecisionCase,
    caseAudit: readyAudit(simpleDecisionCase),
    assert(decisionContext) {
      expect(decisionContext.strategy).toBe("conexao_direta");
      expect(decisionContext.complexity).toBe("baixa");
      expect(decisionContext.objective).toBe(simpleDecisionCase.decisionStatement.goal);
    },
  },
  {
    name: "contexto complexo — restrição obrigatória com sinal de prazo (T02, T03)",
    covers: ["T02", "T03"],
    decisionCase: intermediateDecisionCase,
    caseAudit: readyAudit(intermediateDecisionCase),
    assert(decisionContext) {
      // T02 — mais elementos (uma restrição obrigatória relevante) implica
      // complexidade igual ou maior que o caso simples ("baixa").
      expect(decisionContext.complexity).not.toBe("baixa");

      // T03 — a restrição menciona um prazo (viagem em 3 meses): a
      // urgência não pode ficar "não determinada", e a classificação deve
      // ser rastreável ao sinal de prazo relatado (assumptions ou rationale).
      expect(decisionContext.urgency).not.toBe("nao_determinado");
      const trace = [...decisionContext.assumptions, decisionContext.rationale].join(" ").toLowerCase();
      expect(trace).toMatch(/viagem|prazo|três meses|3 meses/);
    },
  },
];
