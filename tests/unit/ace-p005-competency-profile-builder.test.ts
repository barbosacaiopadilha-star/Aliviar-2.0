import { describe, expect, it } from "vitest";

import { createDecisionCase, type CreateDecisionCaseInput } from "@/modules/ace/artifacts/decision-case";
import { p003CaseAudit } from "@/modules/ace/protocols/p003-case-audit";
import { p004DecisionContextModeler, type P004Modeling } from "@/modules/ace/protocols/p004-decision-context-modeler";
import { p005CompetencyProfileBuilder } from "@/modules/ace/protocols/p005-competency-profile-builder";
import type { DecisionType, ComplexityLevel } from "@/modules/ace/artifacts/decision-context";
import type { CompetencyFocus, ExperienceLevel } from "@/modules/ace/artifacts/competency-profile";

function buildCaseInput(): CreateDecisionCaseInput {
  return {
    sourceNarrativeId: "narrative-1",
    decisionStatement: {
      decision: "Decisão de teste.",
      goal: "Objetivo de teste.",
      sourceType: "fato_relatado",
    },
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: [],
  };
}

async function buildDecisionContext(decisionType: DecisionType, complexity: ComplexityLevel) {
  const decisionCase = createDecisionCase(buildCaseInput());
  const caseAudit = await p003CaseAudit.execute({ decisionCase });

  const modeling: P004Modeling = {
    decisionType,
    objective: decisionCase.decisionStatement.goal,
    clinicalDomain: "saude_fisica",
    complexity,
    urgency: "nao_determinado",
    strategy: "conexao_direta",
    assumptions: [],
    rationale: "Contexto de teste.",
  };

  return p004DecisionContextModeler.execute({ decisionCase, caseAudit, modeling });
}

describe("P005 — Competency Profile Builder (transição P004 → P005)", () => {
  const focusCases: Array<[DecisionType, CompetencyFocus]> = [
    ["buscar_avaliacao", "avaliacao"],
    ["decidir_intervencao", "intervencao"],
    ["buscar_acompanhamento", "acompanhamento_continuo"],
    ["esclarecer_duvida", "esclarecimento"],
  ];

  it.each(focusCases)("traduz decisionType %s em focus %s", async (decisionType, expectedFocus) => {
    const decisionContext = await buildDecisionContext(decisionType, "baixa");

    const profile = await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(profile.focus).toBe(expectedFocus);
  });

  const experienceCases: Array<[ComplexityLevel, ExperienceLevel]> = [
    ["baixa", "geral"],
    ["media", "experiente"],
    ["alta", "altamente_experiente"],
  ];

  it.each(experienceCases)(
    "traduz complexity %s em experienceLevel %s",
    async (complexity, expectedExperience) => {
      const decisionContext = await buildDecisionContext("buscar_avaliacao", complexity);

      const profile = await p005CompetencyProfileBuilder.execute(decisionContext);

      expect(profile.experienceLevel).toBe(expectedExperience);
    },
  );

  it("carrega o domain sem alteração", async () => {
    const decisionContext = await buildDecisionContext("buscar_avaliacao", "baixa");

    const profile = await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(profile.domain).toBe(decisionContext.clinicalDomain);
  });

  it("rastreia o DecisionContext por id e versão", async () => {
    const decisionContext = await buildDecisionContext("buscar_avaliacao", "baixa");

    const profile = await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(profile.sourceArtifacts).toEqual([
      {
        artifactId: decisionContext.id,
        artifactVersion: decisionContext.version,
        artifactType: "DecisionContext",
      },
    ]);
  });

  it("nunca contém especialidade, especialista, elegibilidade ou compatibilidade", async () => {
    const decisionContext = await buildDecisionContext("decidir_intervencao", "alta");

    const profile = await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(profile).not.toHaveProperty("specialty");
    expect(profile).not.toHaveProperty("specialists");
    expect(profile).not.toHaveProperty("compatibility");
  });

  it("nunca modifica o DecisionContext de origem", async () => {
    const decisionContext = await buildDecisionContext("buscar_avaliacao", "baixa");
    const snapshot = JSON.stringify(decisionContext);

    await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(JSON.stringify(decisionContext)).toBe(snapshot);
  });

  it("é determinístico: mesma entrada produz o mesmo focus/experienceLevel/domain", async () => {
    const decisionContext = await buildDecisionContext("decidir_intervencao", "media");

    const profileA = await p005CompetencyProfileBuilder.execute(decisionContext);
    const profileB = await p005CompetencyProfileBuilder.execute(decisionContext);

    expect(profileA.focus).toBe(profileB.focus);
    expect(profileA.experienceLevel).toBe(profileB.experienceLevel);
    expect(profileA.domain).toBe(profileB.domain);
  });
});
