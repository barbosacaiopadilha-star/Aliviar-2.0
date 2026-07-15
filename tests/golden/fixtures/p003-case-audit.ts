// Fixtures golden do P003 (Case Audit) — docs/ace/04-specs/P003-case-audit/examples.md.
//
// A maior parte do CaseAudit (status READY/READY_WITH_WARNINGS/BLOCKED por
// decision/goal ausentes) é determinística (auditDecisionStatement/
// auditMissingInformation em p003-case-audit.ts) — não depende do modelo.
// O único conteúdo genuinamente dependente do modelo é `additionalFindings`
// (achados que exigem análise semântica, ex. contradição — ver comentário
// no topo de p003-case-audit.ts e o exemplo "Informação contraditória" em
// examples.md). Por isso as fixtures golden focam nesse ponto: um caso
// limpo (o modelo não deve inventar achado nenhum) e um caso com
// contradição real (o modelo deve sinalizá-la).

import { expect } from "vitest";

import { createDecisionCase, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { GoldenFixture } from "./types";

export type P003GoldenFixture = GoldenFixture<CaseAudit> & { decisionCase: DecisionCase };

const originEvidence = (quote: string) => ({ quote, source: "narrativa" as const });

export const p003Fixtures: P003GoldenFixture[] = [
  {
    name: "caso limpo — decisão e objetivo claros, sem contradição (nenhum achado espúrio)",
    covers: ["T01"],
    decisionCase: createDecisionCase({
      sourceNarrativeId: "golden-narrative-p003-clean",
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
    }),
    assert(caseAudit) {
      // O modelo não deve inventar um achado adicional para um caso sem
      // nenhuma contradição/ambiguidade real na entrada.
      expect(caseAudit.status).toBe("READY");
      expect(caseAudit.blockingIssues).toHaveLength(0);
    },
  },
  {
    name: "restrições obrigatórias contraditórias — contradição deve ser sinalizada (T08)",
    covers: ["T08"],
    decisionCase: createDecisionCase({
      sourceNarrativeId: "golden-narrative-p003-contradiction",
      decisionStatement: {
        decision: "Decidir a melhor data para realizar um procedimento eletivo.",
        goal: "Ter clareza sobre quando realizar o procedimento.",
        sourceType: "fato_relatado",
        originEvidence: originEvidence("precisa decidir a melhor data para o procedimento"),
      },
      mandatoryConstraints: [
        {
          description: "Só pode realizar o procedimento em outubro.",
          sourceType: "fato_relatado",
          originEvidence: originEvidence("só posso fazer isso em outubro"),
        },
        {
          description: "Não pode realizar o procedimento em outubro.",
          sourceType: "fato_relatado",
          originEvidence: originEvidence("não posso de jeito nenhum em outubro, por causa de uma viagem"),
        },
      ],
      preferences: [],
      missingInformation: [],
    }),
    assert(caseAudit) {
      expect(caseAudit.status).toBe("BLOCKED");
      expect(
        caseAudit.blockingIssues.some((issue) => issue.category === "contradicao"),
      ).toBe(true);
    },
  },
];
