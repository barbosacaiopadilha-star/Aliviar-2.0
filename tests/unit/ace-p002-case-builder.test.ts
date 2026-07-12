import { describe, expect, it } from "vitest";

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { p002CaseBuilder, type P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";

describe("P002 — Case Builder (transformação P001 → P002)", () => {
  it("produz um DecisionCase válido a partir de uma Narrative do P001 (caso simples)", async () => {
    const narrative = createNarrative({
      text: "A cliente relata ansiedade crescente nas últimas oito semanas, associada a uma mudança recente de emprego. Ela busca um espaço de conversa com um psicólogo. A decisão que precisa tomar é encontrar esse profissional; o objetivo esperado é ter um espaço de escuta para lidar com a ansiedade atual.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const extractedFields: P002ExtractedFields = {
      decisionStatement: {
        decision: "Encontrar um profissional (psicólogo) para conversar sobre a ansiedade atual.",
        goal: "Ter um espaço de escuta para lidar com a ansiedade.",
        sourceType: "fato_relatado",
        originEvidence: {
          quote: "A decisão que precisa tomar é encontrar esse profissional; o objetivo esperado é ter um espaço de escuta",
          source: "narrativa",
        },
      },
      mandatoryConstraints: [],
      preferences: [
        {
          description: "Prefere um espaço de conversa, sem necessidade de acompanhamento mais estruturado.",
          sourceType: "fato_relatado",
          originEvidence: { quote: "sem sentir necessidade de um acompanhamento mais estruturado", source: "narrativa" },
        },
      ],
      missingInformation: [],
    };

    const decisionCase = await p002CaseBuilder.execute({ narrative, extractedFields });

    expect(decisionCase.sourceNarrativeId).toBe(narrative.id);
    expect(decisionCase.decisionStatement.decision).toContain("psicólogo");
    expect(decisionCase.preferences).toHaveLength(1);
    expect(decisionCase.mandatoryConstraints).toHaveLength(0);
    expect(decisionCase.missingInformation).toHaveLength(0);
    expect(decisionCase.version).toBe(1);
  });

  it("nunca contém campos proibidos mesmo que a extração tente incluí-los", async () => {
    const narrative = createNarrative({
      text: "Narrativa de teste.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const extractedFields = {
      decisionStatement: {
        decision: "Decisão de teste.",
        goal: "Objetivo de teste.",
        sourceType: "fato_relatado",
        specialty: "cardiologia",
      },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [],
    } as unknown as P002ExtractedFields;

    await expect(p002CaseBuilder.execute({ narrative, extractedFields })).rejects.toThrow(
      /FORBIDDEN_FIELD_PRESENT|especialidade|specialty/i,
    );
  });

  it("produz decision null (nunca string vazia) quando a narrativa não define uma decisão clara (caso complexo)", async () => {
    const narrative = createNarrative({
      text: "O cliente relata um quadro de dor/desconforto presente há quase um ano. Ainda não tem uma decisão específica definida. O objetivo esperado é sentir que sua história foi de fato compreendida antes de qualquer indicação.",
      closingQuestionsAnswered: { historia: true, decisao: false, objetivo: true },
    });

    const extractedFields: P002ExtractedFields = {
      decisionStatement: {
        decision: null,
        goal: "Sentir que sua história foi de fato compreendida antes de qualquer indicação.",
        sourceType: "fato_relatado",
      },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [
        {
          description:
            "A decisão específica que o cliente precisa tomar ainda não está definida — ele está em fase de entender as opções disponíveis.",
          relatedField: "decision",
        },
      ],
    };

    const decisionCase = await p002CaseBuilder.execute({ narrative, extractedFields });

    expect(decisionCase.decisionStatement.decision).toBeNull();
    expect(decisionCase.missingInformation).toHaveLength(1);
    expect(decisionCase.missingInformation[0].relatedField).toBe("decision");
  });
});
