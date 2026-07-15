// Fixtures golden do P002 (Case Builder) — as 3 narrativas de
// docs/ace/04-specs/P002-case-builder/examples.md (que por sua vez
// reaproveita docs/ace/04-specs/P001-intake/examples.md), com assertions
// de regra derivadas de docs/ace/04-specs/P002-case-builder/tests.md.
//
// Cada `assert` verifica só o que a especificação exige para aquele caso
// específico — nunca o texto exato gerado pelo modelo.

import { expect } from "vitest";

import { createNarrative, type Narrative } from "@/modules/ace/artifacts/narrative";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { GoldenFixture } from "./types";

export type P002GoldenFixture = GoldenFixture<DecisionCase> & { narrative: Narrative };

export const p002Fixtures: P002GoldenFixture[] = [
  {
    name: "caso simples — decisão e objetivo claros, sem restrições",
    covers: ["T02", "T03"],
    narrative: createNarrative({
      text: "A cliente relata ansiedade crescente nas últimas oito semanas, associada a uma mudança recente de emprego. Não há tratamento anterior relacionado. Ela busca um espaço de conversa com um psicólogo, sem sentir necessidade de um acompanhamento mais estruturado neste momento. A decisão que precisa tomar é encontrar esse profissional; o objetivo esperado é ter um espaço de escuta para lidar com a ansiedade atual.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    }),
    assert(decisionCase) {
      expect(decisionCase.decisionStatement.decision).not.toBeNull();
      expect(decisionCase.decisionStatement.goal).not.toBeNull();

      // T03 — todo elemento extraído é marcado como fato relatado ou
      // inferência estrutural.
      expect(["fato_relatado", "inferencia_estrutural"]).toContain(decisionCase.decisionStatement.sourceType);

      // T02 — toda restrição/preferência tem evidência de origem não vazia.
      for (const preference of decisionCase.preferences) {
        expect(preference.originEvidence.quote.trim().length).toBeGreaterThan(0);
      }
      for (const constraint of decisionCase.mandatoryConstraints) {
        expect(constraint.originEvidence.quote.trim().length).toBeGreaterThan(0);
      }
    },
  },
  {
    name: "caso intermediário — restrição obrigatória relevante (viagem de trabalho)",
    covers: ["T02", "T03"],
    narrative: createNarrative({
      text: "O cliente foi orientado por seu médico a avaliar uma cirurgia no joelho, já realizou ressonância e uma consulta com ortopedista há duas semanas. Sua principal dúvida é decidir se a cirurgia é realmente necessária — ele relata receio de passar por um procedimento sem necessidade real. Uma restrição relevante para a decisão é uma viagem de trabalho importante prevista para daqui a três meses, período em que ele não gostaria de estar em recuperação. A decisão que precisa tomar é se segue ou não com a cirurgia; o objetivo esperado é ter clareza e segurança antes de decidir.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    }),
    assert(decisionCase) {
      // A especificação exige que a restrição de viagem/recuperação relatada
      // na narrativa apareça como restrição obrigatória, com evidência.
      expect(decisionCase.mandatoryConstraints.length).toBeGreaterThanOrEqual(1);
      for (const constraint of decisionCase.mandatoryConstraints) {
        expect(constraint.originEvidence.quote.trim().length).toBeGreaterThan(0);
        expect(["fato_relatado", "inferencia_estrutural"]).toContain(constraint.sourceType);
      }
    },
  },
  {
    name: "caso complexo — decisão ainda não definida (informação ausente, nunca inventada)",
    covers: ["T08"],
    narrative: createNarrative({
      text: "O cliente relata um quadro de dor/desconforto presente há quase um ano, já tendo passado por fisioterapia, uso de medicação para dor, e exames de imagem (ressonância e tomografia), sem melhora percebida. Ele expressa cansaço com tentativas anteriores e o receio de não ser realmente ouvido antes de receber um diagnóstico. Neste momento, ainda não tem uma decisão específica definida — está em uma etapa de entender quais opções existem antes de decidir qualquer próximo passo. O objetivo esperado é sentir que sua história foi de fato compreendida antes de qualquer indicação.",
      closingQuestionsAnswered: { historia: true, decisao: false, objetivo: true },
    }),
    assert(decisionCase) {
      // T08 — informação ausente nunca é inventada, e nunca é string vazia:
      // decision deve ser null (nunca fabricado), com a lacuna registrada.
      expect(decisionCase.decisionStatement.decision).toBeNull();
      expect(
        decisionCase.missingInformation.some((item) => item.relatedField === "decision"),
      ).toBe(true);
      expect(decisionCase.decisionStatement.goal).not.toBeNull();
    },
  },
];
